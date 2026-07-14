import type { SourceLinkState } from '@/features/designs/detail/types';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/** Validates a design source URL for safe external opening. */
export function validateSourceUrl(raw: string | null | undefined): SourceLinkState {
  if (!raw || !raw.trim()) {
    return { status: 'missing' };
  }

  const trimmed = raw.trim();

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return {
        status: 'invalid',
        reason: 'Only http and https links are supported.',
      };
    }
    if (!parsed.hostname) {
      return { status: 'invalid', reason: 'This link is missing a hostname.' };
    }
    return { status: 'valid', url: parsed.toString() };
  } catch {
    return { status: 'invalid', reason: 'This source link looks incomplete or malformed.' };
  }
}
