import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';

export default function UnlockRecoveryScreen() {
  const { unlockWithRecovery } = useVault();
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const onUnlock = async () => {
    setLoading(true);
    try {
      await unlockWithRecovery(phrase);
      router.replace('/reset-master-password');
    } catch (e) {
      Alert.alert('Recovery failed', friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock with recovery key</Text>
      <Text style={styles.hint}>Enter the 12-word recovery key you saved at setup.</Text>
      <TextInput
        style={styles.input}
        multiline
        placeholder="word1 word2 …"
        placeholderTextColor="#64748b"
        value={phrase}
        onChangeText={setPhrase}
        autoCapitalize="none"
        accessibilityLabel="Recovery key phrase"
      />
      <Pressable style={styles.primary} onPress={onUnlock} disabled={loading || phrase.trim().length < 10}>
        <Text style={styles.primaryText}>{loading ? 'Unlocking…' : 'Unlock'}</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => router.back()}>
        <Text style={styles.linkText}>Use master password instead</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 80 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 12 },
  hint: { color: '#94a3b8', marginBottom: 16 },
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, minHeight: 48, justifyContent: 'center' },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  link: { marginTop: 20, padding: 12, minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#93c5fd', textAlign: 'center' },
});