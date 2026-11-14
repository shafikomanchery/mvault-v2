import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { copySensitive } from '@/src/clipboard';

export default function VaultListScreen() {
  const { logins, searchQuery, setSearchQuery, lockVault, pendingSyncConflict } = useVault();

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return logins;
    return logins.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.username.toLowerCase().includes(q) ||
        (l.url ?? '').toLowerCase().includes(q)
    );
  }, [logins, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        {pendingSyncConflict ? (
          <Pressable onPress={() => router.push('/sync-conflict')} accessibilityLabel="Resolve sync conflict">
            <Text style={styles.conflict}>Sync conflict — tap to resolve</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={lockVault} style={styles.lockBtn} accessibilityLabel="Lock vault">
          <Text style={styles.lock}>Lock</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search logins"
        placeholderTextColor="#64748b"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No logins yet. Add your first one.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/(vault)/login/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.username}</Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => void copySensitive(item.username)}
                accessibilityLabel="Copy username"
              >
                <Text style={styles.action}>Copy user</Text>
              </Pressable>
              <Pressable
                onPress={() => item.password && void copySensitive(item.password)}
                accessibilityLabel="Copy password"
              >
                <Text style={styles.action}>Copy pass</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(vault)/login/new')}
        accessibilityLabel="Add login"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  conflict: { color: '#f87171', fontWeight: '600' },
  lockBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  lock: { color: '#f87171', fontWeight: '600' },
  search: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  name: { color: '#fff', fontWeight: '700', fontSize: 16 },
  meta: { color: '#94a3b8', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  action: { color: '#60a5fa', fontWeight: '600' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
