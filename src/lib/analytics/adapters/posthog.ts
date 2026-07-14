import type { AnalyticsEvent, AnalyticsTraits } from '@/lib/analytics/events';
import type { AnalyticsProvider } from '@/lib/analytics/provider';
import { sanitizeProperties } from '@/lib/analytics/sanitize';

/**
 * PostHog placeholder adapter.
 * Wire `posthog-react-native` (or HTTP) when EXPO_PUBLIC_POSTHOG_KEY is set.
 */
export class PostHogAnalyticsProvider implements AnalyticsProvider {
  private readonly apiKey: string | undefined;
  private readonly host: string;

  constructor(options?: { apiKey?: string; host?: string }) {
    this.apiKey = options?.apiKey ?? process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
    this.host =
      options?.host ?? process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() ?? 'https://app.posthog.com';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  identify(userId: string, traits?: AnalyticsTraits): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: posthog.identify(userId, sanitizeProperties(traits))
    void userId;
    void traits;
    void this.host;
  }

  track(event: AnalyticsEvent): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: posthog.capture(event.name, sanitizeProperties(event.properties))
    void sanitizeProperties(event.properties as Record<string, unknown>);
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: posthog.screen(name, sanitizeProperties(properties))
    void name;
    void properties;
  }

  reset(): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: posthog.reset()
  }
}
