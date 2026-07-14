import type { AnalyticsEvent, AnalyticsTraits } from '@/lib/analytics/events';

export interface AnalyticsProvider {
  identify(userId: string, traits?: AnalyticsTraits): void;
  track(event: AnalyticsEvent): void;
  screen(name: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

export type AnalyticsClientConfig = {
  enabled: boolean;
  requireConsent: boolean;
  providers: AnalyticsProvider[];
  validateInDev: boolean;
};
