import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useVault } from '@/src/state/VaultContext';
import { friendlyError } from '@/src/errors';
import { SyncStatusChip } from '@/src/components/SyncStatusChip';

export default function SettingsScreen() {
  const {
    accountSession,
    syncNow,
    syncStatus,
    isVaultUnlocked,
    signOut,
    deleteAccount,
    exportBackup,
    importBackup,
    enableBiometrics,
    disableBiometrics,
    biometricsAvailable,
    clipboardClearSeconds,
    setClipboardClearSecondsPref,
  } = useVault();
  const [bioOn, setBioOn] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

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

  const onImport = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets[0]) return;
      const content = await FileSystem.readAsStringAsync(picked.assets[0].uri);
      await importBackup(content);
      Alert.alert('Imported', 'Backup restored and synced.');
    } catch (e) {
      Alert.alert('Import failed', friendlyError(e));
    }
  };

  const onDeleteAccount = () => {
    const email = accountSession?.email ?? '';
    Alert.alert(
      'Delete account',
      `This permanently deletes your account and encrypted vault on the server. Type your email to confirm.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (deleteConfirm.trim().toLowerCase() !== email.toLowerCase()) {
              Alert.alert('Email mismatch', 'Enter your account email in the field below first.');
              return;
            }
            try {
              await deleteAccount();
              router.replace('/(auth)/welcome');
            } catch (e) {
              Alert.alert('Delete failed', friendlyError(e));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowBetween}>
        <Text style={styles.section}>Sync</Text>
        <SyncStatusChip status={syncStatus} isUnlocked={isVaultUnlocked} />
      </View>
      <Pressable style={styles.btn} onPress={() => syncNow().catch((e) => Alert.alert('Sync failed', friendlyError(e)))}>
        <Text style={styles.btnText}>Sync now</Text>
      </Pressable>

      <Text style={styles.section}>Security</Text>
      <Pressable style={styles.btn} onPress={() => router.push('/change-master-password')}>
        <Text style={styles.btnText}>Change master password</Text>
      </Pressable>
      <View style={styles.clipboardRow}>
        <Text style={styles.clipboardLabel}>Clear clipboard after 30s</Text>
        <Switch
          value={clipboardClearSeconds > 0}
          onValueChange={async (on) => setClipboardClearSecondsPref(on ? 30 : 0)}
          accessibilityLabel="Clear clipboard after thirty seconds"
        />
      </View>
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

      <Text style={styles.section}>Backup</Text>
      <Pressable style={styles.btn} onPress={onExport}>
        <Text style={styles.btnText}>Export encrypted backup</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={onImport}>
        <Text style={styles.btnText}>Import encrypted backup</Text>
      </Pressable>

      <Text style={styles.section}>Account</Text>
      <Pressable style={styles.danger} onPress={() => signOut()}>
        <Text style={styles.dangerText}>Sign out</Text>
      </Pressable>

      <Text style={styles.sectionDanger}>Delete account</Text>
      <Text style={styles.note}>Type {accountSession?.email ?? 'your email'} to enable delete.</Text>
      <TextInput
        style={styles.input}
        placeholder="Account email"
        placeholderTextColor="#64748b"
        value={deleteConfirm}
        onChangeText={setDeleteConfirm}
        autoCapitalize="none"
        accessibilityLabel="Confirm account email for deletion"
      />
      <Pressable style={styles.deleteBtn} onPress={onDeleteAccount} accessibilityLabel="Delete account">
        <Text style={styles.dangerText}>Delete account and vault</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  section: { color: '#94a3b8', marginTop: 8, marginBottom: 8, fontWeight: '600' },
  sectionDanger: { color: '#f87171', marginTop: 24, marginBottom: 8, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 10, minHeight: 48, justifyContent: 'center' },
  btnText: { color: '#e2e8f0', fontWeight: '600' },
  clipboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    minHeight: 48,
  },
  clipboardLabel: { color: '#e2e8f0', flex: 1, marginRight: 12 },
  danger: { marginTop: 8, padding: 14, minHeight: 48, justifyContent: 'center' },
  dangerText: { color: '#f87171', textAlign: 'center', fontWeight: '600' },
  deleteBtn: { backgroundColor: '#450a0a', padding: 14, borderRadius: 10, marginTop: 8, minHeight: 48, justifyContent: 'center' },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, minHeight: 48 },
  note: { color: '#64748b', fontSize: 12, marginBottom: 8 },
});