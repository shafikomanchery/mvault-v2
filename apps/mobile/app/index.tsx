import { Redirect } from 'expo-router';
import { useVault } from '@/src/state/VaultContext';

export default function Index() {
  const { accountSession, isVaultUnlocked, needsMasterPasswordReset } = useVault();

  if (!accountSession) return <Redirect href="/(auth)/welcome" />;
  if (!isVaultUnlocked) return <Redirect href="/(auth)/unlock" />;
  if (needsMasterPasswordReset) return <Redirect href="/reset-master-password" />;
  return <Redirect href="/(vault)" />;
}
