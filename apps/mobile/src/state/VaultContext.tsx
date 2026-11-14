import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Login } from '@mvault/core';
import {
  applyLoginDelete,
  applyLoginSave,
  exportEncryptedBackup,
  importEncryptedBackup,
  pushVaultWithConflictHandling,
  setupVault,
  unlockVault,
} from '@mvault/core';
import { decryptLogins, parseStoredVault, unlockVaultWithMaster } from '@mvault/crypto';
import type { AuthSession } from '@mvault/ports';
import { getAdapters } from '../di/container';
import { expoSecureStorage } from '../adapters/expoSecureStorage';
import {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricAvailable,
  unlockVaultKeyWithBiometric,
} from '../adapters/biometricVaultKey';

const SESSION_KEY = 'mvault_session';
const IDLE_MS = 5 * 60 * 1000;

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'conflict' | 'idle';

type VaultContextValue = {
  accountSession: AuthSession | null;
  isVaultUnlocked: boolean;
  logins: Login[];
  syncStatus: SyncStatus;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeVault: (masterPassword: string) => Promise<string>;
  unlockWithMaster: (masterPassword: string) => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  lockVault: () => void;
  saveLogin: (login: Login) => Promise<void>;
  deleteLogin: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
  exportBackup: () => string;
  importBackup: (content: string) => Promise<void>;
  enableBiometrics: () => Promise<void>;
  disableBiometrics: () => Promise<void>;
  biometricsAvailable: boolean;
  pendingRecoveryPhrase: string | null;
  clearPendingRecovery: () => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { auth, vault } = useMemo(() => getAdapters(), []);
  const [accountSession, setAccountSession] = useState<AuthSession | null>(null);
  const [vaultKey, setVaultKey] = useState<Uint8Array | null>(null);
  const [serialized, setSerialized] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [logins, setLogins] = useState<Login[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRecoveryPhrase, setPendingRecoveryPhrase] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const masterPasswordRef = useRef<string | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricsAvailable);
    expoSecureStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) return;
      try {
        const session = JSON.parse(raw) as AuthSession;
        auth.setSession(session);
        setAccountSession(session);
      } catch {
        /* ignore */
      }
    });
  }, [auth]);

  const persistSession = async (session: AuthSession | null) => {
    if (session) {
      await expoSecureStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      await expoSecureStorage.deleteItem(SESSION_KEY);
    }
  };

  const resetIdle = useCallback(() => {
    if (!vaultKey) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setVaultKey(null);
      setLogins([]);
      setSerialized(null);
      masterPasswordRef.current = null;
    }, IDLE_MS);
  }, [vaultKey]);

  const lockVault = useCallback(() => {
    setVaultKey(null);
    setLogins([]);
    setSerialized(null);
    masterPasswordRef.current = null;
  }, []);

  const pushLocal = useCallback(
    async (nextSerialized: string, nextLogins: Login[]) => {
      if (!masterPasswordRef.current) return;
      setSyncStatus('syncing');
      try {
        const result = await pushVaultWithConflictHandling(
          vaultKey!,
          nextSerialized,
          nextLogins,
          revision,
          masterPasswordRef.current,
          vault
        );
        setSerialized(result.serialized);
        setLogins(result.logins);
        setRevision(result.revision);
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Vault sync failed', err);
        setSyncStatus('offline');
      }
    },
    [revision, vault, vaultKey]
  );

  const signIn = async (email: string, password: string) => {
    const session = await auth.login(email, password);
    setAccountSession(session);
    await persistSession(session);
  };

  const signUp = async (email: string, password: string) => {
    const session = await auth.register(email, password);
    setAccountSession(session);
    await persistSession(session);
  };

  const signOut = async () => {
    if (accountSession) await auth.logout(accountSession.refreshToken);
    auth.setSession(null);
    setAccountSession(null);
    await persistSession(null);
    lockVault();
  };

  const initializeVault = async (masterPassword: string) => {
    const { recoveryPhrase, serializedVault, revision: newRevision } = await setupVault(
      masterPassword,
      vault
    );
    masterPasswordRef.current = masterPassword;
    const unlocked = await unlockVaultWithMaster(serializedVault, masterPassword);
    setVaultKey(unlocked.vaultKey);
    setSerialized(serializedVault);
    setRevision(newRevision);
    setLogins(unlocked.logins as Login[]);
    setPendingRecoveryPhrase(recoveryPhrase);
    setSyncStatus('synced');
    resetIdle();
    return recoveryPhrase;
  };

  const unlockWithMaster = async (masterPassword: string) => {
    const unlocked = await unlockVault(masterPassword, vault);
    masterPasswordRef.current = masterPassword;
    setVaultKey(unlocked.vaultKey);
    setSerialized(unlocked.serialized);
    setRevision(unlocked.revision);
    setLogins(unlocked.logins as Login[]);
    setSyncStatus('synced');
    resetIdle();
  };

  const unlockWithBiometric = async () => {
    const key = await unlockVaultKeyWithBiometric();
    if (!key || !serialized) return false;
    try {
      const stored = parseStoredVault(serialized);
      const payload = await decryptLogins(key, stored.logins);
      setVaultKey(key);
      setLogins(payload.logins as Login[]);
      resetIdle();
      return true;
    } catch {
      return false;
    }
  };

  const saveLogin = async (login: Login) => {
    if (!vaultKey || !serialized) {
      throw new Error('Vault is locked. Unlock again before saving.');
    }
    const next = await applyLoginSave(vaultKey, serialized, login);
    const stored = parseStoredVault(next);
    const payload = await decryptLogins(vaultKey, stored.logins);
    setSerialized(next);
    setLogins(payload.logins as Login[]);
    await pushLocal(next, payload.logins as Login[]);
    resetIdle();
  };

  const deleteLogin = async (id: string) => {
    if (!vaultKey || !serialized) return;
    const next = await applyLoginDelete(vaultKey, serialized, id);
    const stored = parseStoredVault(next);
    const payload = await decryptLogins(vaultKey, stored.logins);
    setSerialized(next);
    setLogins(payload.logins as Login[]);
    await pushLocal(next, payload.logins as Login[]);
    resetIdle();
  };

  const syncNow = async () => {
    if (!masterPasswordRef.current) return;
    const envelope = await vault.pullVault();
    if (!envelope) return;
    const unlocked = await unlockVaultWithMaster(envelope.ciphertext, masterPasswordRef.current);
    setSerialized(envelope.ciphertext);
    setRevision(envelope.revision);
    setVaultKey(unlocked.vaultKey);
    setLogins(unlocked.logins as Login[]);
    setSyncStatus('synced');
  };

  const exportBackup = () => {
    if (!serialized) throw new Error('No vault');
    return exportEncryptedBackup(serialized);
  };

  const importBackup = async (content: string) => {
    const vaultBlob = importEncryptedBackup(content);
    if (!masterPasswordRef.current) throw new Error('Unlock vault first');
    const unlocked = await unlockVaultWithMaster(vaultBlob, masterPasswordRef.current);
    setSerialized(vaultBlob);
    setVaultKey(unlocked.vaultKey);
    setLogins(unlocked.logins as Login[]);
    await pushLocal(vaultBlob, unlocked.logins as Login[]);
  };

  const enableBiometrics = async () => {
    if (!vaultKey) throw new Error('Vault locked');
    await enableBiometricUnlock(vaultKey);
  };

  const value: VaultContextValue = {
    accountSession,
    isVaultUnlocked: !!vaultKey,
    logins,
    syncStatus,
    searchQuery,
    setSearchQuery,
    signIn,
    signUp,
    signOut,
    initializeVault,
    unlockWithMaster,
    unlockWithBiometric,
    lockVault,
    saveLogin,
    deleteLogin,
    syncNow,
    exportBackup,
    importBackup,
    enableBiometrics,
    disableBiometrics: disableBiometricUnlock,
    biometricsAvailable,
    pendingRecoveryPhrase,
    clearPendingRecovery: () => setPendingRecoveryPhrase(null),
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault outside provider');
  return ctx;
}
