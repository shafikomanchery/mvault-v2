import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Login } from '@mvault/core';
import {
  UnresolvedSyncConflictError,
  applyLoginDelete,
  applyLoginSave,
  changeVaultMasterPassword,
  exportEncryptedBackup,
  importEncryptedBackup,
  pushVaultWithConflictHandling,
  resetVaultMasterPassword,
  setupVault,
  unlockVault,
  unlockVaultFromRecovery,
} from '@mvault/core';
import { decryptLogins, parseStoredVault, unlockVaultWithMaster } from '@mvault/crypto';
import type { AuthSession, VaultEnvelope } from '@mvault/ports';
import { AuthError } from '@mvault/ports';
import { getAdapters } from '../di/container';
import { expoSecureStorage } from '../adapters/expoSecureStorage';
import {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricAvailable,
  unlockVaultKeyWithBiometric,
} from '../adapters/biometricVaultKey';
import { setClipboardClearSeconds } from '../clipboard';

const SESSION_KEY = 'mvault_session';
const CLIPBOARD_CLEAR_KEY = 'mvault_clipboard_clear_s';
const IDLE_MS = 5 * 60 * 1000;

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'conflict' | 'idle';

export type SyncConflictState = {
  localSerialized: string;
  localLogins: Login[];
  serverEnvelope: VaultEnvelope;
};

type VaultContextValue = {
  accountSession: AuthSession | null;
  isVaultUnlocked: boolean;
  needsMasterPasswordReset: boolean;
  logins: Login[];
  syncStatus: SyncStatus;
  pendingSyncConflict: SyncConflictState | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  clipboardClearSeconds: number;
  setClipboardClearSecondsPref: (seconds: number) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  initializeVault: (masterPassword: string) => Promise<string>;
  unlockWithMaster: (masterPassword: string) => Promise<void>;
  unlockWithRecovery: (recoveryPhrase: string) => Promise<void>;
  completeMasterPasswordReset: (newMasterPassword: string, recoveryPhrase: string) => Promise<void>;
  changeMasterPassword: (
    currentMasterPassword: string,
    newMasterPassword: string,
    recoveryPhrase: string
  ) => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  lockVault: () => void;
  saveLogin: (login: Login) => Promise<void>;
  deleteLogin: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
  exportBackup: () => string;
  importBackup: (content: string) => Promise<void>;
  resolveConflictKeepLocal: () => Promise<void>;
  resolveConflictUseServer: () => Promise<void>;
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
  const [pendingSyncConflict, setPendingSyncConflict] = useState<SyncConflictState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRecoveryPhrase, setPendingRecoveryPhrase] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [needsMasterPasswordReset, setNeedsMasterPasswordReset] = useState(false);
  const [clipboardClearSeconds, setClipboardClearSec] = useState(30);
  const masterPasswordRef = useRef<string | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistSession = useCallback(
    async (session: AuthSession | null) => {
      if (session) {
        await expoSecureStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        await expoSecureStorage.deleteItem(SESSION_KEY);
      }
    },
    []
  );

  useEffect(() => {
    auth.setSessionChangeHandler((session) => {
      setAccountSession(session);
      void persistSession(session);
    });
    return () => auth.setSessionChangeHandler(null);
  }, [auth, persistSession]);

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
    expoSecureStorage.getItem(CLIPBOARD_CLEAR_KEY).then((raw) => {
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isNaN(n) && n >= 0) {
        setClipboardClearSec(n);
        setClipboardClearSeconds(n);
      }
    });
  }, [auth]);

  const lockVaultInternal = useCallback(() => {
    setVaultKey(null);
    setLogins([]);
    setSerialized(null);
    masterPasswordRef.current = null;
    setSyncStatus('idle');
    setNeedsMasterPasswordReset(false);
  }, []);

  const lockVault = useCallback(() => {
    lockVaultInternal();
  }, [lockVaultInternal]);

  const resetIdle = useCallback(() => {
    if (!vaultKey) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      lockVaultInternal();
    }, IDLE_MS);
  }, [vaultKey, lockVaultInternal]);

  useEffect(() => {
    const onState = (state: AppStateStatus) => {
      if ((state === 'background' || state === 'inactive') && vaultKey) {
        lockVaultInternal();
      }
    };
    const sub = AppState.addEventListener('change', onState);
    return () => sub.remove();
  }, [lockVaultInternal, vaultKey]);

  const handleSyncError = (err: unknown) => {
    if (err instanceof UnresolvedSyncConflictError) {
      setPendingSyncConflict({
        localSerialized: err.localSerialized,
        localLogins: err.localLogins,
        serverEnvelope: err.serverEnvelope,
      });
      setSyncStatus('conflict');
      return;
    }
    if (err instanceof AuthError && err.code === 'NETWORK') {
      setSyncStatus('offline');
      return;
    }
    console.warn('Vault sync failed', err);
    setSyncStatus('offline');
  };

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
        setPendingSyncConflict(null);
        setSyncStatus('synced');
      } catch (err) {
        handleSyncError(err);
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

  const deleteAccount = async () => {
    await auth.deleteAccount();
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
    setNeedsMasterPasswordReset(false);
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
    setNeedsMasterPasswordReset(false);
    setSyncStatus('synced');
    resetIdle();
  };

  const unlockWithRecovery = async (recoveryPhrase: string) => {
    const unlocked = await unlockVaultFromRecovery(recoveryPhrase.trim(), vault);
    masterPasswordRef.current = null;
    setVaultKey(unlocked.vaultKey);
    setSerialized(unlocked.serialized);
    setRevision(unlocked.revision);
    setLogins(unlocked.logins as Login[]);
    setNeedsMasterPasswordReset(true);
    setSyncStatus('synced');
    resetIdle();
  };

  const completeMasterPasswordReset = async (newMasterPassword: string, recoveryPhrase: string) => {
    if (!vaultKey || !serialized) throw new Error('Vault is locked');
    const next = await resetVaultMasterPassword(
      serialized,
      vaultKey,
      newMasterPassword,
      recoveryPhrase.trim(),
      logins
    );
    masterPasswordRef.current = newMasterPassword;
    setSerialized(next);
    setNeedsMasterPasswordReset(false);
    await pushLocal(next, logins);
    resetIdle();
  };

  const changeMasterPassword = async (
    currentMasterPassword: string,
    newMasterPassword: string,
    recoveryPhrase: string
  ) => {
    if (!serialized) throw new Error('Vault is locked');
    const next = await changeVaultMasterPassword(
      serialized,
      currentMasterPassword,
      newMasterPassword,
      recoveryPhrase.trim(),
      logins
    );
    masterPasswordRef.current = newMasterPassword;
    const unlocked = await unlockVaultWithMaster(next, newMasterPassword);
    setVaultKey(unlocked.vaultKey);
    setSerialized(next);
    setLogins(unlocked.logins as Login[]);
    await pushLocal(next, unlocked.logins as Login[]);
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
    if (!masterPasswordRef.current) {
      throw new Error('Unlock with your master password before syncing.');
    }
    setSyncStatus('syncing');
    try {
      const envelope = await vault.pullVault();
      if (!envelope) return;
      const unlocked = await unlockVaultWithMaster(envelope.ciphertext, masterPasswordRef.current);
      setSerialized(envelope.ciphertext);
      setRevision(envelope.revision);
      setVaultKey(unlocked.vaultKey);
      setLogins(unlocked.logins as Login[]);
      setSyncStatus('synced');
    } catch (err) {
      handleSyncError(err);
      throw err;
    }
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

  const resolveConflictKeepLocal = async () => {
    if (!pendingSyncConflict || !masterPasswordRef.current) return;
    setSyncStatus('syncing');
    try {
      const envelope = await vault.pushVault(
        pendingSyncConflict.localSerialized,
        pendingSyncConflict.serverEnvelope.revision
      );
      setSerialized(envelope.ciphertext);
      setLogins(pendingSyncConflict.localLogins);
      setRevision(envelope.revision);
      setPendingSyncConflict(null);
      setSyncStatus('synced');
    } catch (err) {
      handleSyncError(err);
    }
  };

  const resolveConflictUseServer = async () => {
    if (!pendingSyncConflict || !masterPasswordRef.current) return;
    setSyncStatus('syncing');
    try {
      const { serverEnvelope } = pendingSyncConflict;
      const unlocked = await unlockVaultWithMaster(
        serverEnvelope.ciphertext,
        masterPasswordRef.current
      );
      setSerialized(serverEnvelope.ciphertext);
      setRevision(serverEnvelope.revision);
      setVaultKey(unlocked.vaultKey);
      setLogins(unlocked.logins as Login[]);
      setPendingSyncConflict(null);
      setSyncStatus('synced');
    } catch (err) {
      handleSyncError(err);
    }
  };

  const setClipboardClearSecondsPref = async (seconds: number) => {
    setClipboardClearSec(seconds);
    setClipboardClearSeconds(seconds);
    await expoSecureStorage.setItem(CLIPBOARD_CLEAR_KEY, String(seconds));
  };

  const enableBiometrics = async () => {
    if (!vaultKey) throw new Error('Vault locked');
    await enableBiometricUnlock(vaultKey);
  };

  const value: VaultContextValue = {
    accountSession,
    isVaultUnlocked: !!vaultKey,
    needsMasterPasswordReset,
    logins,
    syncStatus,
    pendingSyncConflict,
    searchQuery,
    setSearchQuery,
    clipboardClearSeconds,
    setClipboardClearSecondsPref,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    initializeVault,
    unlockWithMaster,
    unlockWithRecovery,
    completeMasterPasswordReset,
    changeMasterPassword,
    unlockWithBiometric,
    lockVault,
    saveLogin,
    deleteLogin,
    syncNow,
    exportBackup,
    importBackup,
    resolveConflictKeepLocal,
    resolveConflictUseServer,
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