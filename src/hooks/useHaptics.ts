import { useCallback } from 'react';

import { HapticKind, triggerHaptic } from '@/utils/haptic';

export function useHaptics() {
  const haptic = useCallback((kind: HapticKind = 'light') => {
    void triggerHaptic(kind);
  }, []);

  return { haptic };
}
