import { describe, expect, it } from 'vitest';

import { mosaicLayoutForCount, resolveCoverSources } from '@/features/collections/cover';

describe('resolveCoverSources', () => {
  it('prefers a custom cover over item mosaics', () => {
    expect(
      resolveCoverSources({
        customCoverUrl: 'https://example.com/cover.jpg',
        itemImageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      }),
    ).toEqual(['https://example.com/cover.jpg']);
  });

  it('builds a mosaic from unique item images', () => {
    expect(
      resolveCoverSources({
        itemImageUrls: [
          'https://example.com/a.jpg',
          'https://example.com/a.jpg',
          'https://example.com/b.jpg',
          null,
          'https://example.com/c.jpg',
        ],
      }),
    ).toEqual([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
      'https://example.com/c.jpg',
    ]);
  });
});

describe('mosaicLayoutForCount', () => {
  it('maps counts to layouts', () => {
    expect(mosaicLayoutForCount(0)).toBe('empty');
    expect(mosaicLayoutForCount(1)).toBe('single');
    expect(mosaicLayoutForCount(2)).toBe('split');
    expect(mosaicLayoutForCount(3)).toBe('triptych');
    expect(mosaicLayoutForCount(4)).toBe('quad');
  });
});
