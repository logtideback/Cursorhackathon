import { describe, expect, it } from 'vitest';

import { CONSUMER_PERSONAS, CREATOR_PERSONAS, DESIGN_BLUEPRINTS } from '../catalog';
import { createPrng } from '../prng';
import { SEED_SIZES } from '../sizes';
import { CATEGORY_DEFS, PROVENANCES, TAG_DEFS } from '../taxonomy';

describe('seed catalogue', () => {
  it('includes 30 creators and 150 unique designs', () => {
    expect(CREATOR_PERSONAS).toHaveLength(30);
    expect(DESIGN_BLUEPRINTS).toHaveLength(150);
    expect(new Set(DESIGN_BLUEPRINTS.map((d) => d.title)).size).toBe(150);
    expect(new Set(DESIGN_BLUEPRINTS.map((d) => d.description)).size).toBe(150);
  });

  it('covers product taxonomy and all provenance types', () => {
    expect(CATEGORY_DEFS).toHaveLength(12);
    expect(TAG_DEFS.length).toBeGreaterThanOrEqual(40);
    const provenances = new Set(DESIGN_BLUEPRINTS.map((d) => d.provenance));
    for (const value of PROVENANCES) {
      expect(provenances.has(value)).toBe(true);
    }
  });

  it('defines size presets for small, medium, and full', () => {
    expect(SEED_SIZES.small.designs).toBeLessThan(SEED_SIZES.medium.designs);
    expect(SEED_SIZES.medium.designs).toBeLessThan(SEED_SIZES.full.designs);
    expect(SEED_SIZES.full.creators).toBe(30);
    expect(SEED_SIZES.full.designs).toBe(150);
    expect(CONSUMER_PERSONAS.length).toBeGreaterThanOrEqual(SEED_SIZES.full.consumers);
  });

  it('keeps PRNG deterministic', () => {
    const a = createPrng('taste-seed-full-dev-v1');
    const b = createPrng('taste-seed-full-dev-v1');
    expect([a.next(), a.next(), a.int(1, 10)]).toEqual([b.next(), b.next(), b.int(1, 10)]);
  });
});
