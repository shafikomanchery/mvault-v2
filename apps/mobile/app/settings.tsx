import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';

export default function SettingsScreen() {
  const {
    syncNow,
    syncStatus,
    signOut,
    exportBackup,
    enableBiometrics,
    disableBiometrics,
    biometricsAvailable,
  } = useVault();
  const [bioOn, setBioOn] = useState(false);

  const onExport = async () => {
    try {
      const content = exportBackup();
      const path = `${FileSystem.cacheDirectory}mvault-backup.json`;
      await FileSystem.writeAsStringAsync(path, content);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path);
      else Alert.alert('Backup ready', 'Sharing is not available on this device.');
    } catch (e) {
      Alert.alert('Export failed', friendlyError(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.row}>Sync: {syncStatus}</Text>
      <Pressable style={styles.btn} onPress={() => syncNow()}>
        <Text style={styles.btnText}>Sync now</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={onExport}>
        <Text style={styles.btnText}>Export encrypted backup</Text>
      </Pressable>
      {biometricsAvailable && (
        <Pressable
          style={styles.btn}
          onPress={async () => {
            try {
              if (bioOn) {
                await disableBiometrics();
                setBioOn(false);
              } else {
                await enableBiometrics();
                setBioOn(true);
              }
            } catch (e) {
              Alert.alert('Biometrics', friendlyError(e));
            }
          }}
        >
          <Text style={styles.btnText}>{bioOn ? 'Disable biometrics' : 'Enable biometrics'}</Text>
        </Pressable>
      )}
      <Pressable style={styles.danger} onPress={() => signOut()}>
        <Text style={styles.dangerText}>Sign out</Text>
      </Pressable>
      <Text style={styles.note}>
        Account sign-out does not delete server data. Use API account delete in a future settings
        update or contact support.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  row: { color: '#94a3b8', marginBottom: 16 },
  btn: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 10 },
  btnText: { color: '#e2e8f0', fontWeight: '600' },
  danger: { marginTop: 24, padding: 14 },
  dangerText: { color: '#f87171', textAlign: 'center' },
  note: { color: '#64748b', fontSize: 12, marginTop: 24 },
});
