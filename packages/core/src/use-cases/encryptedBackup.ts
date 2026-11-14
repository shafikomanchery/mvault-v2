/** v2 encrypted backup file: base64 of stored vault JSON (already encrypted). */
export function exportEncryptedBackup(serializedVault: string): string {
  const payload = {
    format: 'mvault-backup-v2',
    exportedAt: new Date().toISOString(),
    vault: serializedVault,
  };
  return JSON.stringify(payload, null, 2);
}

export function importEncryptedBackup(fileContent: string): string {
  const parsed = JSON.parse(fileContent) as {
    format?: string;
    vault?: string;
  };
  if (parsed.format !== 'mvault-backup-v2' || !parsed.vault) {
    throw new Error('Invalid backup file');
  }
  return parsed.vault;
}
