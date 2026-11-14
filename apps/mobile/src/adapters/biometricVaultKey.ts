import * as LocalAuthentication from 'expo-local-authentication';
import { bytesToBase64, base64ToBytes, aesEncrypt, aesDecrypt } from '@mvault/crypto';
import { expoSecureStorage } from './expoSecureStorage';

const WRAPPED_KEY = 'mvault_wrapped_vault_key';

export async function isBiometricAvailable(): Promise<boolean> {
  const hw = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hw && enrolled;
}

export async function enableBiometricUnlock(vaultKey: Uint8Array): Promise<void> {
  const ok = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Enable biometric unlock',
  });
  if (!ok.success) throw new Error('Biometric setup canceled');
  const wrapper = crypto.getRandomValues(new Uint8Array(32));
  const wrapped = await aesEncrypt(wrapper, vaultKey);
  await expoSecureStorage.setItem(
    WRAPPED_KEY,
    JSON.stringify({
      iv: wrapped.iv,
      ciphertext: wrapped.ciphertext,
      wrapper: bytesToBase64(wrapper),
    })
  );
}

export async function unlockVaultKeyWithBiometric(): Promise<Uint8Array | null> {
  const raw = await expoSecureStorage.getItem(WRAPPED_KEY);
  if (!raw) return null;
  const ok = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock mVault',
  });
  if (!ok.success) return null;
  const parsed = JSON.parse(raw) as { iv: string; ciphertext: string; wrapper: string };
  const wrapKey = base64ToBytes(parsed.wrapper);
  return aesDecrypt(wrapKey, { iv: parsed.iv, ciphertext: parsed.ciphertext });
}

export async function disableBiometricUnlock(): Promise<void> {
  await expoSecureStorage.deleteItem(WRAPPED_KEY);
}
