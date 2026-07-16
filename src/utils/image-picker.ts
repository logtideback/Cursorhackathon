/**
 * Web-safe image picker helpers.
 * Native keeps full expo-image-picker behaviour; web uses the same API with
 * softer permission messaging (browsers use a file input).
 */
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export async function ensureMediaLibraryAccess(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', message);
    return false;
  }
  return true;
}

export { ImagePicker };
