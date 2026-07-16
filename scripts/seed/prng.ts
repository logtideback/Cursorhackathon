/** Tiny deterministic PRNG (mulberry32) for repeatable seeds. */

export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0 || 1;
}

export type Prng = {
  next: () => number;
  int: (min: number, maxInclusive: number) => number;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
  bool: (probability?: number) => boolean;
  sample: <T>(items: readonly T[], count: number) => T[];
};

export function createPrng(seed: string | number): Prng {
  let state = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min, maxInclusive) {
      return Math.floor(next() * (maxInclusive - min + 1)) + min;
    },
    pick(items) {
      if (items.length === 0) {
        throw new Error('Cannot pick from empty list');
      }
      return items[Math.floor(next() * items.length)]!;
    },
    shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
    bool(probability = 0.5) {
      return next() < probability;
    },
    sample(items, count) {
      return this.shuffle(items).slice(0, Math.min(count, items.length));
    },
  };
}
