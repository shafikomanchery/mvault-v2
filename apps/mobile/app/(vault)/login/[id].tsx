import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useVault } from '@/src/state/VaultContext';

export default function LoginDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logins, saveLogin, deleteLogin } = useVault();
  const login = useMemo(() => logins.find((l) => l.id === id), [logins, id]);
  const [password, setPassword] = useState(login?.password ?? '');

  if (!login) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Login not found</Text>
      </View>
    );
  }

  const onSave = async () => {
    const updated = {
      ...login,
      password,
      updatedAt: new Date().toISOString(),
      history:
        login.password !== password
          ? [
              ...login.history,
              {
                timestamp: new Date().toISOString(),
                field: 'password',
                oldValue: login.password,
                newValue: password,
              },
            ]
          : login.history,
    };
    await saveLogin(updated);
    Alert.alert('Saved');
  };

  const onDelete = async () => {
    await deleteLogin(login.id);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{login.name}</Text>
      <Text style={styles.meta}>{login.username}</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.secondary} onPress={() => Clipboard.setStringAsync(password)}>
        <Text style={styles.secondaryText}>Copy password</Text>
      </Pressable>
      {login.history.length > 0 && (
        <View style={styles.history}>
          <Text style={styles.historyTitle}>Password history</Text>
          {login.history
            .filter((h) => h.field === 'password')
            .slice(-5)
            .reverse()
            .map((h) => (
              <Text key={h.timestamp} style={styles.historyItem}>
                {new Date(h.timestamp).toLocaleString()}
              </Text>
            ))}
        </View>
      )}
      <Pressable style={styles.primary} onPress={onSave}>
        <Text style={styles.primaryText}>Save changes</Text>
      </Pressable>
      <Pressable style={styles.danger} onPress={onDelete}>
        <Text style={styles.dangerText}>Delete login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  text: { color: '#fff' },
  label: { color: '#fff', fontSize: 22, fontWeight: '700' },
  meta: { color: '#94a3b8', marginBottom: 16 },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 12 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginTop: 8 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  secondary: { padding: 12 },
  secondaryText: { color: '#93c5fd', textAlign: 'center' },
  danger: { marginTop: 16, padding: 12 },
  dangerText: { color: '#f87171', textAlign: 'center' },
  history: { marginTop: 16, marginBottom: 8 },
  historyTitle: { color: '#cbd5e1', fontWeight: '600', marginBottom: 6 },
  historyItem: { color: '#64748b', fontSize: 12 },
});
