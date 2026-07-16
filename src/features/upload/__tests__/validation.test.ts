import { describe, expect, it } from 'vitest';

import { createEmptyDraft, draftHasContent } from '@/features/upload/drafts';
import { MockDesignSimilarityService } from '@/features/upload/moderation';
import {
  buildDesignStoragePath,
  isValidHttpUrl,
  normalizeTag,
  parseTagInput,
  reorderItems,
  validateImageAsset,
  validateImageCount,
} from '@/features/upload/validation';

describe('validateImageAsset', () => {
  it('rejects unsupported types', () => {
    const result = validateImageAsset({
      uri: 'file://shot.bmp',
      mimeType: 'image/bmp',
      fileName: 'shot.bmp',
      byteSize: 1000,
      width: 800,
      height: 800,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('unsupported_type');
    }
  });

  it('accepts jpeg within limits', () => {
    const result = validateImageAsset({
      uri: 'file://shot.jpg',
      mimeType: 'image/jpeg',
      fileName: 'shot.jpg',
      byteSize: 2_000_000,
      width: 1200,
      height: 1600,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects oversized files', () => {
    const result = validateImageAsset({
      uri: 'file://shot.jpg',
      mimeType: 'image/jpeg',
      fileName: 'shot.jpg',
      byteSize: 20_000_000,
      width: 1200,
      height: 1600,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('file_too_large');
    }
  });
});

describe('validateImageCount', () => {
  it('enforces max images', () => {
    expect(validateImageCount(7, 2).ok).toBe(false);
    expect(validateImageCount(2, 2).ok).toBe(true);
  });
});

describe('tags and urls', () => {
  it('normalizes and parses tags', () => {
    expect(normalizeTag(' Soft Shadow ')).toBe('soft-shadow');
    expect(parseTagInput('type, layout, type')).toEqual(['type', 'layout']);
  });

  it('validates source urls', () => {
    expect(isValidHttpUrl('')).toBe(true);
    expect(isValidHttpUrl('https://example.com/work')).toBe(true);
    expect(isValidHttpUrl('ftp://bad')).toBe(false);
  });
});

describe('storage paths', () => {
  it('builds unique owner-scoped paths', () => {
    expect(buildDesignStoragePath('user-1', 'design-9', 'abc', 'full')).toBe(
      'user-1/designs/design-9/abc.jpg',
    );
    expect(buildDesignStoragePath('user-1', 'design-9', 'abc', 'thumb')).toBe(
      'user-1/designs/design-9/thumb_abc.jpg',
    );
  });
});

describe('reorderItems', () => {
  it('moves cover image', () => {
    expect(reorderItems(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
});

describe('draft helpers', () => {
  it('detects empty vs filled drafts', () => {
    const empty = createEmptyDraft('user-1');
    expect(draftHasContent(empty)).toBe(false);
    expect(draftHasContent({ ...empty, title: 'Hello' })).toBe(true);
  });
});

describe('MockDesignSimilarityService', () => {
  it('returns neutral similar designs', async () => {
    const service = new MockDesignSimilarityService();
    const results = await service.findSimilarDesigns('file://primary.jpg');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('designId');
    expect(results[0]).toHaveProperty('score');
  });
});
