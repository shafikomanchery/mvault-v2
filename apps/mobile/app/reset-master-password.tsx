import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';

export default function ResetMasterPasswordScreen() {
  const { completeMasterPasswordReset, needsMasterPasswordReset } = useVault();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recovery, setRecovery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!needsMasterPasswordReset) {
    router.replace('/(vault)');
    return null;
  }

  const onSave = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await completeMasterPasswordReset(newPassword, recovery);
      router.replace('/(vault)');
    } catch (e) {
      Alert.alert('Could not set password', friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set new master password</Text>
      <Text style={styles.hint}>After recovery unlock, choose a new master password and confirm your recovery key.</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="New master password"
        placeholderTextColor="#64748b"
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Confirm master password"
        placeholderTextColor="#64748b"
        value={confirm}
        onChangeText={setConfirm}
      />
      <TextInput
        style={styles.input}
        placeholder="Recovery key (12 words)"
        placeholderTextColor="#64748b"
        value={recovery}
        onChangeText={setRecovery}
        autoCapitalize="none"
        multiline
      />
      <Pressable style={styles.primary} onPress={onSave} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Saving…' : 'Save and continue'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 40 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 12 },
  hint: { color: '#94a3b8', marginBottom: 16 },
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    minHeight: 48,
  },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginTop: 8, minHeight: 48, justifyContent: 'center' },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});