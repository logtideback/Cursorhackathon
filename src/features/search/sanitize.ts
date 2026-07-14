import { QUERY_MAX_LENGTH } from '@/features/search/constants';

/** Strip control chars, collapse whitespace, and bound length before hitting FTS. */
export function sanitizeSearchQuery(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, QUERY_MAX_LENGTH);
}

export function isBlankQuery(raw: string): boolean {
  return sanitizeSearchQuery(raw).length === 0;
}
