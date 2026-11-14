import { Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function VaultLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerRight: () => (
          <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Settings">
            <Text style={{ color: '#93c5fd', marginRight: 8 }}>Settings</Text>
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
