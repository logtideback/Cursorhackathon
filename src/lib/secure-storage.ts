import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Auth/session storage adapter.
 * Prefers the platform secure store; falls back to AsyncStorage when a value
 * exceeds SecureStore size limits (common for larger JWT payloads on Android).
 */
const SECURE_PREFIX = 'taste.secure.';

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
    await AsyncStorage.removeItem(`${SECURE_PREFIX}fallback:${key}`);
  } catch {
    await AsyncStorage.setItem(`${SECURE_PREFIX}fallback:${key}`, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value != null) {
      return value;
    }
  } catch {
    // fall through
  }
  return AsyncStorage.getItem(`${SECURE_PREFIX}fallback:${key}`);
}

async function secureRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(`${SECURE_PREFIX}fallback:${key}`);
}

export const secureAuthStorage = {
  getItem: (key: string) => secureGet(key),
  setItem: (key: string, value: string) => secureSet(key, value),
  removeItem: (key: string) => secureRemove(key),
};
