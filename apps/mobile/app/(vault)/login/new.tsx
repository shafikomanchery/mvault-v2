import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createLogin } from '@mvault/core';
import { generateStrongPassword } from '@mvault/crypto';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';

export default function NewLoginScreen() {
  const { saveLogin } = useVault();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required');
      return;
    }
    const login = createLogin(
      {
        name: name.trim(),
        username,
        password,
        url,
        accountType: 'website',
        criticality: 'Medium',
      },
      new Date()
    );
    try {
      await saveLogin(login);
      router.back();
    } catch (e) {
      Alert.alert('Save failed', friendlyError(e));
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#64748b" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="URL" placeholderTextColor="#64748b" value={url} onChangeText={setUrl} />
      <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#64748b" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.secondary} onPress={() => setPassword(generateStrongPassword(20))}>
        <Text style={styles.secondaryText}>Generate password</Text>
      </Pressable>
      <Pressable style={styles.primary} onPress={onSave}>
        <Text style={styles.primaryText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 12 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginTop: 8 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  secondary: { padding: 12 },
  secondaryText: { color: '#93c5fd', textAlign: 'center' },
});
