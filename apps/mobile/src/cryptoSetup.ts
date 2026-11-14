import Constants from 'expo-constants';

let ready = false;

/** Native quick-crypto is unavailable in Expo Go; @mvault/crypto uses pure JS (@noble) instead. */
export async function ensureCryptoReady(): Promise<void> {
  if (ready) return;

  const isExpoGo = Constants.appOwnership === 'expo';
  if (!isExpoGo) {
    const { install } = require('react-native-quick-crypto') as typeof import('react-native-quick-crypto');
    install();
  }

  ready = true;
}
