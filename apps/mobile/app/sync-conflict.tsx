import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';

export default function SyncConflictScreen() {
  const { pendingSyncConflict, resolveConflictKeepLocal, resolveConflictUseServer, logins } = useVault();

  if (!pendingSyncConflict) {
    router.back();
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sync conflict</Text>
      <Text style={styles.body}>
        Another device changed your vault and automatic merge failed. Choose which copy to keep.
      </Text>
      <Text style={styles.meta}>This device: {pendingSyncConflict.localLogins.length} logins</Text>
      <Text style={styles.meta}>After server merge you have: {logins.length} logins loaded locally</Text>
      <Pressable
        style={styles.primary}
        onPress={async () => {
          await resolveConflictKeepLocal();
          router.replace('/(vault)');
        }}
        accessibilityLabel="Keep this device version"
      >
        <Text style={styles.primaryText}>Keep this device</Text>
      </Pressable>
      <Pressable
        style={styles.secondary}
        onPress={async () => {
          await resolveConflictUseServer();
          router.replace('/(vault)');
        }}
        accessibilityLabel="Use server version"
      >
        <Text style={styles.secondaryText}>Use server copy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 40 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 12 },
  body: { color: '#94a3b8', marginBottom: 20, lineHeight: 22 },
  meta: { color: '#cbd5e1', marginBottom: 8 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginTop: 16, minHeight: 48, justifyContent: 'center' },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  secondary: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryText: { color: '#93c5fd', textAlign: 'center', fontWeight: '600' },
});