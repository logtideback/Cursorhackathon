export type { AnalyticsEvent, AnalyticsEventName, AnalyticsTraits } from '@/lib/analytics/events';
export type { AnalyticsProvider, AnalyticsClientConfig } from '@/lib/analytics/provider';
export {
  analytics,
  track,
  identify,
  screen,
  resetAnalytics,
} from '@/lib/analytics/client';
export { trackEvent } from '@/lib/analytics/track';
export { useAnalyticsConsentStore } from '@/lib/analytics/consent-store';
export { validateAnalyticsEvent } from '@/lib/analytics/validate';
export { sanitizeProperties } from '@/lib/analytics/sanitize';
export { ConsoleAnalyticsProvider } from '@/lib/analytics/adapters/console';
export { PostHogAnalyticsProvider } from '@/lib/analytics/adapters/posthog';
export { AmplitudeAnalyticsProvider } from '@/lib/analytics/adapters/amplitude';
