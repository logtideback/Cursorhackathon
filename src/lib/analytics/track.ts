/**
 * @deprecated Prefer `track({ name, properties })` from `@/lib/analytics`.
 * Kept as a thin typed alias so existing imports resolve during migration.
 */
export {
  analytics,
  identify,
  resetAnalytics,
  screen,
  track as trackEvent,
} from '@/lib/analytics/client';
export type { AnalyticsEvent } from '@/lib/analytics/events';
