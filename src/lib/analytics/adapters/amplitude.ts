import type { AnalyticsEvent, AnalyticsTraits } from '@/lib/analytics/events';
import type { AnalyticsProvider } from '@/lib/analytics/provider';
import { sanitizeProperties } from '@/lib/analytics/sanitize';

/**
 * Amplitude placeholder adapter.
 * Wire `@amplitude/analytics-react-native` when EXPO_PUBLIC_AMPLITUDE_API_KEY is set.
 */
export class AmplitudeAnalyticsProvider implements AnalyticsProvider {
  private readonly apiKey: string | undefined;

  constructor(options?: { apiKey?: string }) {
    this.apiKey = options?.apiKey ?? process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY?.trim();
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  identify(userId: string, traits?: AnalyticsTraits): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: amplitude.setUserId(userId); amplitude.identify(traits)
    void userId;
    void traits;
  }

  track(event: AnalyticsEvent): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: amplitude.track(event.name, sanitizeProperties(event.properties))
    void sanitizeProperties(event.properties as Record<string, unknown>);
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: amplitude.track(`screen_${name}`, sanitizeProperties(properties))
    void name;
    void properties;
  }

  reset(): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: amplitude.reset()
  }
}
