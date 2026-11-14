import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';

export default function RecoveryScreen() {
  const { pendingRecoveryPhrase, clearPendingRecovery } = useVault();
  const words = useMemo(() => (pendingRecoveryPhrase ?? '').split(' ').filter(Boolean), [pendingRecoveryPhrase]);
  const [picked] = useState(() => {
    const copy = [...words];
    const sample: string[] = [];
    for (let i = 0; i < 3 && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      sample.push(copy.splice(idx, 1)[0]);
    }
    return sample;
  });
  const [inputs, setInputs] = useState<string[]>(['', '', '']);

  const onConfirm = () => {
    const ok = picked.every((w, i) => inputs[i].trim().toLowerCase() === w.toLowerCase());
    if (!ok) {
      Alert.alert('Try again', 'Enter the three words exactly as shown in your recovery key.');
      return;
    }
    clearPendingRecovery();
    router.replace('/(vault)');
  };

  if (!pendingRecoveryPhrase) {
    router.replace('/(vault)');
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Save your recovery key</Text>
      <Text style={styles.key}>{pendingRecoveryPhrase}</Text>
      <Text style={styles.hint}>Write it down. Confirm by typing these words:</Text>
      {picked.map((w, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.wordLabel}>Word “{w}”</Text>
          <TextInput
            style={styles.input}
            value={inputs[i]}
            onChangeText={(t) => {
              const next = [...inputs];
              next[i] = t;
              setInputs(next);
            }}
            autoCapitalize="none"
          />
        </View>
      ))}
      <Pressable style={styles.primary} onPress={onConfirm}>
        <Text style={styles.primaryText}>I saved my recovery key</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 60 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  key: { color: '#e2e8f0', fontFamily: 'monospace', lineHeight: 22, marginBottom: 16, backgroundColor: '#1e293b', padding: 12, borderRadius: 8 },
  hint: { color: '#94a3b8', marginBottom: 12 },
  row: { marginBottom: 10 },
  wordLabel: { color: '#cbd5e1', marginBottom: 4 },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, padding: 12 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginTop: 16 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
