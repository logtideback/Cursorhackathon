/** Seed size presets for Taste development data. */

export type SeedSizeName = 'small' | 'medium' | 'full';

export type SeedSizeConfig = {
  name: SeedSizeName;
  creators: number;
  designs: number;
  consumers: number;
  publicCollections: number;
  privateExtraCollections: number;
  /** Approx swipes per consumer (actual varies by RNG). */
  swipesPerConsumer: number;
  /** Fraction of designs that stay draft (creator edge cases). */
  draftRate: number;
};

export const SEED_SIZES: Record<SeedSizeName, SeedSizeConfig> = {
  small: {
    name: 'small',
    creators: 8,
    designs: 24,
    consumers: 3,
    publicCollections: 4,
    privateExtraCollections: 3,
    swipesPerConsumer: 12,
    draftRate: 0.08,
  },
  medium: {
    name: 'medium',
    creators: 16,
    designs: 80,
    consumers: 6,
    publicCollections: 10,
    privateExtraCollections: 8,
    swipesPerConsumer: 30,
    draftRate: 0.06,
  },
  full: {
    name: 'full',
    creators: 30,
    designs: 150,
    consumers: 10,
    publicCollections: 20,
    privateExtraCollections: 15,
    swipesPerConsumer: 55,
    draftRate: 0.05,
  },
};

export const SEED_PASSWORD = 'TasteSeed-Dev-2026!';
export const SEED_EMAIL_DOMAIN = 'taste.local';
export const SEED_BATCH = 'dev-v1';
