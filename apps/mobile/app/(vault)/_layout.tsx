import { Stack, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SyncStatusChip } from '@/src/components/SyncStatusChip';
import { useVault } from '@/src/state/VaultContext';

function VaultHeaderLeft() {
  const { syncStatus, isVaultUnlocked } = useVault();
  return (
    <View style={{ marginLeft: 8 }}>
      <SyncStatusChip status={syncStatus} isUnlocked={isVaultUnlocked} />
    </View>
  );
}

export default function VaultLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerLeft: () => <VaultHeaderLeft />,
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings"
            style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', paddingRight: 8 }}
          >
            <Text style={{ color: '#93c5fd' }}>Settings</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Logins' }} />
      <Stack.Screen name="login/new" options={{ title: 'New login' }} />
      <Stack.Screen name="login/[id]" options={{ title: 'Login' }} />
    </Stack>
  );
}