/**
 * @deprecated Prefer `track({ name, properties })` from `@/lib/analytics`.
 * Kept as a thin typed alias so existing imports resolve during migration.
 */
export { track as trackEvent, analytics, identify, screen, resetAnalytics } from '@/lib/analytics/client';
export type { AnalyticsEvent } from '@/lib/analytics/events';
