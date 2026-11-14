import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';

export default function SetupVaultScreen() {
  const { initializeVault } = useVault();
  const [master, setMaster] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (master.length < 8) {
      Alert.alert('Too short', 'Master password must be at least 8 characters.');
      return;
    }
    if (master !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await initializeVault(master);
      router.replace('/(auth)/recovery');
    } catch (e) {
      Alert.alert('Setup failed', friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create master password</Text>
      <Text style={styles.hint}>This encrypts your logins. We cannot reset it for you.</Text>
      <TextInput style={styles.input} secureTextEntry placeholder="Master password" placeholderTextColor="#64748b" value={master} onChangeText={setMaster} />
      <TextInput style={styles.input} secureTextEntry placeholder="Confirm" placeholderTextColor="#64748b" value={confirm} onChangeText={setConfirm} />
      <Pressable style={styles.primary} onPress={onSubmit} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Creating vault…' : 'Create vault'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 80 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#fbbf24', marginBottom: 24 },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
