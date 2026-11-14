import { AuthError } from '@mvault/ports';
import { UnresolvedSyncConflictError } from '@mvault/core';

export function friendlyError(err: unknown): string {
  if (err instanceof AuthError) {
    if (err.code === 'INVALID_CREDENTIALS') return 'Invalid email or account password.';
    if (err.code === 'NETWORK') return 'Check your internet connection and try again.';
  }
  if (err instanceof UnresolvedSyncConflictError) {
    return 'Sync conflict could not be merged automatically. Open Settings or the conflict screen to choose a version.';
  }
  if (err instanceof Error) {
    if (err.message === 'Decryption failed') return 'Wrong master password.';
    if (err.message.includes('No vault found')) return 'No vault on this account yet.';
    if (err.message.includes('Unlock')) return err.message;
    if (err.message.includes('vault')) return err.message;
  }
  return 'Something went wrong. Please try again.';
}