import type { AnalyticsEvent } from '@/lib/analytics/events';
import type { AnalyticsProvider } from '@/lib/analytics/provider';
import { sanitizeProperties } from '@/lib/analytics/sanitize';

/**
 * Development / default adapter — console only. Never ships PII-bearing payloads.
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (__DEV__) {
      console.info('[analytics:identify]', userId, sanitizeProperties(traits));
    }
  }

  track(event: AnalyticsEvent): void {
    if (__DEV__) {
      console.info(
        `[analytics:track] ${event.name}`,
        sanitizeProperties(event.properties as Record<string, unknown>),
      );
    }
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    if (__DEV__) {
      console.info('[analytics:screen]', name, sanitizeProperties(properties));
    }
  }

  reset(): void {
    if (__DEV__) {
      console.info('[analytics:reset]');
    }
  }
}
