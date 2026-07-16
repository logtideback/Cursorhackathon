import { create } from 'zustand';

import type { PreferenceSelections } from '@/services/onboarding';

type PreferenceDraftState = PreferenceSelections & {
  setStyles: (values: string[]) => void;
  setIndustries: (values: string[]) => void;
  setPlatforms: (values: string[]) => void;
  setColourFamilies: (values: string[]) => void;
  setCategories: (values: string[]) => void;
  toggle: (
    key:
      | 'preferredStyles'
      | 'preferredIndustries'
      | 'preferredPlatforms'
      | 'preferredColourFamilies'
      | 'preferredCategories',
    id: string,
  ) => void;
  reset: () => void;
  asSelections: () => PreferenceSelections;
};

const empty: PreferenceSelections = {
  preferredCategories: [],
  preferredStyles: [],
  preferredPlatforms: [],
  preferredIndustries: [],
  preferredColourFamilies: [],
};

export const usePreferenceDraftStore = create<PreferenceDraftState>((set, get) => ({
  ...empty,
  setStyles: (preferredStyles) => set({ preferredStyles }),
  setIndustries: (preferredIndustries) => set({ preferredIndustries }),
  setPlatforms: (preferredPlatforms) => set({ preferredPlatforms }),
  setColourFamilies: (preferredColourFamilies) => set({ preferredColourFamilies }),
  setCategories: (preferredCategories) => set({ preferredCategories }),
  toggle: (key, id) =>
    set((state) => {
      const current = state[key];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { [key]: next } as Partial<PreferenceDraftState>;
    }),
  reset: () => set(empty),
  asSelections: () => {
    const state = get();
    return {
      preferredCategories: state.preferredCategories,
      preferredStyles: state.preferredStyles,
      preferredPlatforms: state.preferredPlatforms,
      preferredIndustries: state.preferredIndustries,
      preferredColourFamilies: state.preferredColourFamilies,
    };
  },
}));
