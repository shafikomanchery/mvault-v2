import { Redirect } from 'expo-router';
import { useVault } from '@/src/state/VaultContext';

export default function Index() {
  const { accountSession, isVaultUnlocked } = useVault();

  if (!accountSession) return <Redirect href="/(auth)/welcome" />;
  if (!isVaultUnlocked) return <Redirect href="/(auth)/unlock" />;
  return <Redirect href="/(vault)" />;
}
