/**
 * Content-moderation hooks / adapters used outside the upload wizard.
 * Upload-time safety still lives in `features/upload/moderation`.
 *
 * Replace the placeholder client with a real moderation API or Edge Function
 * before production review queues go live.
 */

import { logger } from '@/lib/logger';

export type ModerationTargetKind = 'design' | 'creator' | 'comment' | 'collection';

export type ModerationHookEvent =
  'report_submitted' | 'user_blocked' | 'user_hidden' | 'design_flagged' | 'pre_publish_reviewed';

export type ModerationHookPayload = {
  event: ModerationHookEvent;
  targetKind: ModerationTargetKind;
  targetId: string;
  reason?: string;
  reporterId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export interface ContentModerationAdapter {
  /** Notify the moderation pipeline after a user report / block / upload flag. */
  notify(payload: ModerationHookPayload): Promise<void>;
  /** Optional async check before surfacing UGC in public feeds. */
  shouldHoldForReview(payload: {
    targetKind: ModerationTargetKind;
    targetId: string;
    signals?: string[];
  }): Promise<boolean>;
}

class PlaceholderContentModerationAdapter implements ContentModerationAdapter {
  async notify(payload: ModerationHookPayload): Promise<void> {
    logger.debug('moderation.notify', payload.event, payload.targetKind, payload.targetId);
  }

  async shouldHoldForReview(payload: {
    targetKind: ModerationTargetKind;
    targetId: string;
    signals?: string[];
  }): Promise<boolean> {
    void payload;
    return false;
  }
}

export const contentModeration: ContentModerationAdapter =
  new PlaceholderContentModerationAdapter();

export async function emitModerationHook(payload: ModerationHookPayload): Promise<void> {
  try {
    await contentModeration.notify(payload);
  } catch (error) {
    logger.warn('moderation hook failed', error);
  }
}
