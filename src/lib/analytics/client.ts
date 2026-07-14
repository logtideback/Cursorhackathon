import { AmplitudeAnalyticsProvider } from '@/lib/analytics/adapters/amplitude';
import { ConsoleAnalyticsProvider } from '@/lib/analytics/adapters/console';
import { PostHogAnalyticsProvider } from '@/lib/analytics/adapters/posthog';
import { useAnalyticsConsentStore } from '@/lib/analytics/consent-store';
import type { AnalyticsEvent, AnalyticsTraits } from '@/lib/analytics/events';
import type { AnalyticsClientConfig, AnalyticsProvider } from '@/lib/analytics/provider';
import { sanitizeProperties } from '@/lib/analytics/sanitize';
import { validateAnalyticsEvent } from '@/lib/analytics/validate';

const SCREEN_DEDUP_WINDOW_MS = 1500;

function buildDefaultProviders(): AnalyticsProvider[] {
  const providers: AnalyticsProvider[] = [new ConsoleAnalyticsProvider()];
  const posthog = new PostHogAnalyticsProvider();
  const amplitude = new AmplitudeAnalyticsProvider();
  if (posthog.isConfigured) {
    providers.push(posthog);
  }
  if (amplitude.isConfigured) {
    providers.push(amplitude);
  }
  return providers;
}

class AnalyticsClient {
  private config: AnalyticsClientConfig;
  private lastScreenKey: string | null = null;
  private lastScreenAt = 0;
  private forceDisabled = false;

  constructor(config?: Partial<AnalyticsClientConfig>) {
    this.config = {
      enabled: true,
      requireConsent: true,
      providers: buildDefaultProviders(),
      validateInDev: true,
      ...config,
    };
  }

  configure(partial: Partial<AnalyticsClientConfig>): void {
    this.config = {
      ...this.config,
      ...partial,
      providers: partial.providers ?? this.config.providers,
    };
  }

  setEnabled(enabled: boolean): void {
    this.forceDisabled = !enabled;
    useAnalyticsConsentStore.getState().setAnalyticsEnabled(enabled);
  }

  private maySend(): boolean {
    if (this.forceDisabled || !this.config.enabled) {
      return false;
    }
    return useAnalyticsConsentStore.getState().canTrack(this.config.requireConsent);
  }

  identify(userId: string, traits?: AnalyticsTraits): void {
    if (!this.maySend() || !userId) {
      return;
    }
    const safeTraits = sanitizeProperties(traits as Record<string, unknown> | undefined);
    for (const provider of this.config.providers) {
      provider.identify(userId, safeTraits);
    }
  }

  track(event: AnalyticsEvent): void {
    // Consent choice itself must remain recordable even when consent was denied/undecided.
    const isConsentAudit = event.name === 'analytics_consent_updated';
    if (!isConsentAudit && !this.maySend()) {
      return;
    }
    if (isConsentAudit && (this.forceDisabled || !this.config.enabled)) {
      return;
    }

    if (this.config.validateInDev && __DEV__) {
      const result = validateAnalyticsEvent(event);
      if (!result.ok) {
        console.warn(`[analytics] dropped malformed event: ${result.message}`, event);
        return;
      }
    }

    const safeProperties = sanitizeProperties(event.properties as Record<string, unknown>);
    for (const provider of this.config.providers) {
      provider.track({
        name: event.name,
        properties: safeProperties,
      } as AnalyticsEvent);
    }
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    if (!this.maySend() || !name) {
      return;
    }

    const key = `${name}:${JSON.stringify(sanitizeProperties(properties))}`;
    const now = Date.now();
    if (this.lastScreenKey === key && now - this.lastScreenAt < SCREEN_DEDUP_WINDOW_MS) {
      return;
    }
    this.lastScreenKey = key;
    this.lastScreenAt = now;

    const safe = sanitizeProperties(properties);
    for (const provider of this.config.providers) {
      provider.screen(name, safe);
    }
  }

  reset(): void {
    this.lastScreenKey = null;
    this.lastScreenAt = 0;
    for (const provider of this.config.providers) {
      provider.reset();
    }
  }
}

export const analytics = new AnalyticsClient();

export function track(event: AnalyticsEvent): void {
  analytics.track(event);
}

export function identify(userId: string, traits?: AnalyticsTraits): void {
  analytics.identify(userId, traits);
}

export function screen(name: string, properties?: Record<string, unknown>): void {
  analytics.screen(name, properties);
}

export function resetAnalytics(): void {
  analytics.reset();
}
