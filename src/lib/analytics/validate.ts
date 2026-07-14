import type { AnalyticsEvent } from '@/lib/analytics/events';

const EVENT_NAMES = new Set<AnalyticsEvent['name']>([
  'app_opened',
  'onboarding_started',
  'onboarding_step_viewed',
  'onboarding_completed',
  'sign_up_completed',
  'sign_in_completed',
  'design_viewed',
  'design_swiped_left',
  'design_swiped_right',
  'swipe_undone',
  'design_saved',
  'design_removed_from_saved',
  'design_added_to_collection',
  'design_removed_from_collection',
  'collection_created',
  'collection_shared',
  'creator_viewed',
  'creator_followed',
  'creator_unfollowed',
  'creator_hidden',
  'creator_blocked',
  'design_shared',
  'source_link_opened',
  'design_uploaded',
  'design_updated',
  'search_started',
  'search_completed',
  'search_result_opened',
  'filter_applied',
  'show_less_selected',
  'report_submitted',
  'recommendation_explanation_viewed',
  'analytics_consent_updated',
]);

export type AnalyticsValidationResult = { ok: true } | { ok: false; message: string };

/**
 * Development-time guard against malformed or incomplete event payloads.
 * Does not throw in production — returns a result so the client can no-op.
 */
export function validateAnalyticsEvent(event: AnalyticsEvent): AnalyticsValidationResult {
  if (!event || typeof event !== 'object') {
    return { ok: false, message: 'Event must be an object' };
  }
  if (!EVENT_NAMES.has(event.name)) {
    return {
      ok: false,
      message: `Unknown event name: ${String((event as { name?: string }).name)}`,
    };
  }
  if (event.properties == null || typeof event.properties !== 'object') {
    return { ok: false, message: `Event ${event.name} is missing properties` };
  }

  switch (event.name) {
    case 'design_swiped_right':
    case 'design_swiped_left':
      if (!event.properties.designId || !event.properties.creatorId) {
        return { ok: false, message: `${event.name} requires designId and creatorId` };
      }
      break;
    case 'collection_created':
      if (!event.properties.collectionId || typeof event.properties.isPrivate !== 'boolean') {
        return { ok: false, message: 'collection_created requires collectionId and isPrivate' };
      }
      break;
    case 'search_started':
    case 'search_completed':
      if (typeof event.properties.queryLength !== 'number') {
        return { ok: false, message: `${event.name} requires queryLength (never raw query)` };
      }
      if ('query' in event.properties) {
        return { ok: false, message: `${event.name} must not include raw query text` };
      }
      break;
    case 'design_saved':
      if (!event.properties.designId || !event.properties.collectionId) {
        return { ok: false, message: 'design_saved requires designId and collectionId' };
      }
      break;
    default:
      break;
  }

  return { ok: true };
}
