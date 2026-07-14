import { create } from 'zustand';

type UiState = {
  isDeckAnimating: boolean;
  setDeckAnimating: (value: boolean) => void;
};

/** Ephemeral UI flags that don't belong in server cache. */
export const useUiStore = create<UiState>((set) => ({
  isDeckAnimating: false,
  setDeckAnimating: (isDeckAnimating) => set({ isDeckAnimating }),
}));
