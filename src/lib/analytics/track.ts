type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

/**
 * Lightweight analytics bridge. Logs in development; ready to swap for a vendor SDK.
 */
export function trackEvent(name: string, properties?: AnalyticsPayload): void {
  if (__DEV__) {
    // Keep payloads inspectable without shipping noise to production consoles.
    console.info(`[analytics] ${name}`, properties ?? {});
  }
  // Future: forward to Amplitude / PostHog / Segment here.
}
