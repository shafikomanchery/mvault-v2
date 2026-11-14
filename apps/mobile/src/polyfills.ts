import 'react-native-get-random-values';
import * as ExpoCrypto from 'expo-crypto';

const cryptoObj = globalThis.crypto ?? ({} as Crypto);
if (typeof cryptoObj.getRandomValues !== 'function') {
  Object.assign(cryptoObj, {
    getRandomValues: (array: Uint8Array) => {
      const bytes = ExpoCrypto.getRandomBytes(array.length);
      array.set(bytes);
      return array;
    },
  });
}
if (typeof cryptoObj.randomUUID !== 'function') {
  cryptoObj.randomUUID = () => ExpoCrypto.randomUUID() as ReturnType<Crypto['randomUUID']>;
}
globalThis.crypto = cryptoObj;
