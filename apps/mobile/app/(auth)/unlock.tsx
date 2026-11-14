import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { getAdapters } from '@/src/di/container';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';

export default function UnlockScreen() {
  const { unlockWithMaster, unlockWithBiometric, biometricsAvailable } = useVault();
  const [master, setMaster] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { vault } = getAdapters();
    vault.pullVault().then((envelope) => {
      if (!envelope) router.replace('/(auth)/setup-vault');
    });
  }, []);

  const onUnlock = async () => {
    setLoading(true);
    try {
      await unlockWithMaster(master);
      router.replace('/(vault)');
    } catch (e) {
      Alert.alert('Unlock failed', friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const onBio = async () => {
    const ok = await unlockWithBiometric();
    if (ok) router.replace('/(vault)');
    else Alert.alert('Biometrics', 'Could not unlock with biometrics.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock vault</Text>
      <TextInput style={styles.input} secureTextEntry placeholder="Master password" placeholderTextColor="#64748b" value={master} onChangeText={setMaster} />
      <Pressable style={styles.primary} onPress={onUnlock} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Unlocking…' : 'Unlock'}</Text>
      </Pressable>
      {biometricsAvailable && (
        <Pressable style={styles.secondary} onPress={onBio}>
          <Text style={styles.secondaryText}>Use biometrics</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 100 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 24 },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  secondary: { marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  secondaryText: { color: '#93c5fd', textAlign: 'center' },
});
