import * as Clipboard from 'expo-clipboard';

let clearTimer: ReturnType<typeof setTimeout> | null = null;
let clipboardClearSeconds = 30;

export function setClipboardClearSeconds(seconds: number) {
  clipboardClearSeconds = seconds;
}

export function getClipboardClearSeconds() {
  return clipboardClearSeconds;
}

export async function copySensitive(text: string) {
  await Clipboard.setStringAsync(text);
  if (clearTimer) clearTimeout(clearTimer);
  if (clipboardClearSeconds <= 0) return;
  clearTimer = setTimeout(() => {
    void Clipboard.setStringAsync('');
    clearTimer = null;
  }, clipboardClearSeconds * 1000);
}