import { describe, expect, it } from 'vitest';

import { validateSourceUrl } from '@/features/designs/detail/source-link';

describe('validateSourceUrl', () => {
  it('accepts https links', () => {
    expect(validateSourceUrl('https://example.com/work')).toEqual({
      status: 'valid',
      url: 'https://example.com/work',
    });
  });

  it('rejects unsupported protocols', () => {
    const result = validateSourceUrl('ftp://example.com/file');
    expect(result.status).toBe('invalid');
  });

  it('rejects malformed values', () => {
    const result = validateSourceUrl('not-a-url');
    expect(result.status).toBe('invalid');
  });

  it('treats empty as missing', () => {
    expect(validateSourceUrl(null)).toEqual({ status: 'missing' });
    expect(validateSourceUrl('   ')).toEqual({ status: 'missing' });
  });
});
