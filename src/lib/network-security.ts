/**
 * Network-security policy helpers for Taste clients.
 *
 * Platform config (see `app.config.ts`):
 * - Android: avoid cleartext by requiring HTTPS API bases; optionally set
 *   `android.usesCleartextTraffic=false` via `expo-build-properties` when added
 * - iOS: App Transport Security defaults (HTTPS only)
 * - Supabase URL must be https (validated in `validatePublicEnv`)
 *
 * Never ship a service-role key or plaintext auth tokens over the network.
 */

import type { AppEnvName } from '@/lib/env';

export type NetworkSecurityIssue = {
  level: 'error' | 'warning';
  message: string;
};

export function auditNetworkSecurity(params: {
  supabaseUrl: string;
  configured: boolean;
  appEnv: AppEnvName;
}): NetworkSecurityIssue[] {
  const issues: NetworkSecurityIssue[] = [];

  if (!params.configured) {
    issues.push({
      level: 'warning',
      message: 'Supabase is not configured; network calls will use a placeholder client.',
    });
    return issues;
  }

  if (!params.supabaseUrl.startsWith('https://')) {
    issues.push({
      level: 'error',
      message: 'Supabase URL must use HTTPS.',
    });
  }

  if (params.appEnv === 'production' && params.supabaseUrl.includes('localhost')) {
    issues.push({
      level: 'error',
      message: 'Production builds must not point at localhost.',
    });
  }

  return issues;
}

/** True when the app should refuse cleartext / insecure base URLs. */
export function requiresSecureTransport(appEnv: AppEnvName): boolean {
  return appEnv === 'preview' || appEnv === 'production' || !__DEV__;
}
