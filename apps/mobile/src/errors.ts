import { AuthError } from '@mvault/ports';

export function friendlyError(err: unknown): string {
  if (err instanceof AuthError) {
    if (err.code === 'INVALID_CREDENTIALS') return 'Invalid email or account password.';
    if (err.code === 'NETWORK') return 'Check your internet connection and try again.';
  }
  if (err instanceof Error) {
    if (err.message === 'Decryption failed') return 'Wrong master password.';
    if (err.message.includes('vault')) return err.message;
  }
  return 'Something went wrong. Please try again.';
}
