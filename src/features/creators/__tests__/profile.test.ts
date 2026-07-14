import { describe, expect, it } from 'vitest';

import { PROVENANCE_EXPLANATIONS } from '@/features/creators/constants';
import { getMockCreatorProfile } from '@/features/creators/mock';

describe('getMockCreatorProfile', () => {
  it('marks suspended and blocked ids', () => {
    const suspended = getMockCreatorProfile('creator-suspended');
    expect(suspended.accountStatus).toBe('suspended');

    const blocked = getMockCreatorProfile('creator-blocked');
    expect(blocked.isBlocking).toBe(true);
  });

  it('detects self profile', () => {
    const profile = getMockCreatorProfile('me', 'me');
    expect(profile.isSelf).toBe(true);
  });
});

describe('PROVENANCE_EXPLANATIONS', () => {
  it('covers every provenance choice', () => {
    expect(Object.keys(PROVENANCE_EXPLANATIONS)).toEqual([
      'original_work',
      'client_work',
      'concept',
      'redesign',
      'ai_assisted',
      'fully_ai_generated',
    ]);
  });
});
