import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { SyncStatus } from '@/src/state/VaultContext';

const LABELS: Record<SyncStatus, string> = {
  synced: 'Synced',
  syncing: 'Syncing…',
  offline: 'Offline',
  conflict: 'Conflict',
  idle: 'Locked',
};

const COLORS: Record<SyncStatus, string> = {
  synced: '#22c55e',
  syncing: '#60a5fa',
  offline: '#fbbf24',
  conflict: '#f87171',
  idle: '#94a3b8',
};

export function SyncStatusChip({ status, isUnlocked }: { status: SyncStatus; isUnlocked: boolean }) {
  const display = isUnlocked ? status : 'idle';
  const label = isUnlocked ? LABELS[status] : 'Locked';
  const color = COLORS[display];

  const content = (
    <View style={[styles.chip, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );

  if (status === 'conflict') {
    return (
      <Pressable onPress={() => router.push('/sync-conflict')} accessibilityLabel="Resolve sync conflict">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
});