import { describe, expect, it } from 'vitest';

import { darkColors, getColorsForScheme, lightColors } from '@/theme/colors';

describe('theme colors', () => {
  it('keeps editorial light paper as the light scheme', () => {
    expect(lightColors.background).toBe('#F6F4F1');
    expect(lightColors.accent).toBe('#3E5C4A');
  });

  it('provides a charcoal dark scheme without purple accents', () => {
    const dark = getColorsForScheme('dark');
    expect(dark.background).toBe(darkColors.background);
    expect(dark.accent.toLowerCase()).not.toContain('7c');
    expect(dark.text).not.toBe(lightColors.text);
  });
});
