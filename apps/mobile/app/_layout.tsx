import '../src/polyfills';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ensureCryptoReady } from '@/src/cryptoSetup';
import { VaultProvider } from '@/src/state/VaultContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [cryptoReady, setCryptoReady] = useState(false);

  useEffect(() => {
    ensureCryptoReady()
      .then(() => setCryptoReady(true))
      .catch((err) => {
        console.error('Crypto setup failed', err);
        setCryptoReady(true);
      });
  }, []);

  useEffect(() => {
    if (cryptoReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [cryptoReady]);

  if (!cryptoReady) {
    return null;
  }

  return (
    <VaultProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(vault)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </VaultProvider>
  );
}
