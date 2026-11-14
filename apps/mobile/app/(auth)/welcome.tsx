import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>mVault</Text>
      <Text style={styles.subtitle}>Your passwords, encrypted and synced.</Text>
      <Link href="/(auth)/register" asChild>
        <Pressable style={styles.primary}>
          <Text style={styles.primaryText}>Create account</Text>
        </Pressable>
      </Link>
      <Link href="/(auth)/login" asChild>
        <Pressable style={styles.secondary}>
          <Text style={styles.secondaryText}>Sign in</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#94a3b8', marginBottom: 32 },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginBottom: 12 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  secondary: { borderColor: '#334155', borderWidth: 1, padding: 16, borderRadius: 12 },
  secondaryText: { color: '#e2e8f0', textAlign: 'center', fontWeight: '600' },
});
