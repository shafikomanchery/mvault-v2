import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';

export default function RegisterScreen() {
  const { signUp } = useVault();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      router.replace('/(auth)/setup-vault');
    } catch (e) {
      Alert.alert('Registration failed', friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.hint}>Account password unlocks sync only — not your vault.</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Text style={styles.label}>Account password</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.primary} onPress={onSubmit} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Creating…' : 'Continue'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 80 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#94a3b8', marginBottom: 24 },
  label: { color: '#94a3b8', marginBottom: 6, fontSize: 12, textTransform: 'uppercase' },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginTop: 8 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
