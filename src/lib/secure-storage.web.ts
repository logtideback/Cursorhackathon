import AsyncStorage from '@react-native-async-storage/async-storage';

/** Web auth storage — AsyncStorage / localStorage (SecureStore is native-only). */
export const secureAuthStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
