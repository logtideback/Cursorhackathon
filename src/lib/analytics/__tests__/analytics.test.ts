import { describe, expect, it } from 'vitest';

import type { AnalyticsEvent } from '@/lib/analytics/events';
import { sanitizeProperties } from '@/lib/analytics/sanitize';
import { validateAnalyticsEvent } from '@/lib/analytics/validate';

describe('sanitizeProperties', () => {
  it('strips passwords, notes, email, and raw queries', () => {
    const clean = sanitizeProperties({
      designId: 'd1',
      password: 'secret',
      note: 'private observation',
      email: 'a@b.com',
      query: 'brutalist neon',
      queryLength: 14,
    });
    expect(clean).toEqual({ designId: 'd1', queryLength: 14 });
  });
});

describe('validateAnalyticsEvent', () => {
  it('accepts a well-formed swipe event', () => {
    const event: AnalyticsEvent = {
      name: 'design_swiped_right',
      properties: {
        designId: 'd1',
        creatorId: 'c1',
        source: 'discover',
      },
    };
    expect(validateAnalyticsEvent(event)).toEqual({ ok: true });
  });

  it('rejects search events that include a raw query field', () => {
    const event = {
      name: 'search_started',
      properties: {
        queryLength: 4,
        hasQuery: true,
        resultType: 'design',
        query: 'type',
      },
    } as AnalyticsEvent;
    const result = validateAnalyticsEvent(event);
    expect(result.ok).toBe(false);
  });

  it('rejects unknown event names', () => {
    const result = validateAnalyticsEvent({
      name: 'password_entered',
      properties: {},
    } as unknown as AnalyticsEvent);
    expect(result.ok).toBe(false);
  });

  it('requires collectionId and isPrivate for collection_created', () => {
    const result = validateAnalyticsEvent({
      name: 'collection_created',
      properties: { collectionId: 'c1' },
    } as AnalyticsEvent);
    expect(result.ok).toBe(false);
  });

  it('accepts analytics_consent_updated payloads', () => {
    expect(
      validateAnalyticsEvent({
        name: 'analytics_consent_updated',
        properties: { granted: false, source: 'settings' },
      }),
    ).toEqual({ ok: true });
  });
});
