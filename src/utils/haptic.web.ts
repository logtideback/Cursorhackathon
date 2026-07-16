export type HapticKind =
  'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/** Web: haptics are unavailable — no-op so native expo-haptics stays out of the web bundle. */
export async function triggerHaptic(_kind: HapticKind = 'light'): Promise<void> {
  // no-op
}
