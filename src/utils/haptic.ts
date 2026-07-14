import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind =
  'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export async function triggerHaptic(kind: HapticKind = 'light'): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  switch (kind) {
    case 'selection':
      await Haptics.selectionAsync();
      break;
    case 'success':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'medium':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'light':
    default:
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
  }
}
