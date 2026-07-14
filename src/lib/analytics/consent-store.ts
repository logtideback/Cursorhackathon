import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AnalyticsConsentState = {
  /** null = undecided; true/false = explicit choice */
  consentGranted: boolean | null;
  analyticsEnabled: boolean;
  hasHydrated: boolean;
  setConsent: (granted: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  /** Analytics may run only when enabled and consent is granted (or consent not required). */
  canTrack: (requireConsent: boolean) => boolean;
};

export const useAnalyticsConsentStore = create<AnalyticsConsentState>()(
  persist(
    (set, get) => ({
      consentGranted: null,
      analyticsEnabled: true,
      hasHydrated: false,
      setConsent: (granted) => set({ consentGranted: granted, analyticsEnabled: granted }),
      setAnalyticsEnabled: (enabled) => set({ analyticsEnabled: enabled }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      canTrack: (requireConsent) => {
        const state = get();
        if (!state.analyticsEnabled) {
          return false;
        }
        if (!requireConsent) {
          return true;
        }
        return state.consentGranted === true;
      },
    }),
    {
      name: 'taste:analytics-consent',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        consentGranted: state.consentGranted,
        analyticsEnabled: state.analyticsEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
