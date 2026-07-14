import Constants from 'expo-constants';

import { auditNetworkSecurity } from '@/lib/network-security';

export type AppEnvName = 'development' | 'preview' | 'production';

type PublicEnv = {
  appEnv: AppEnvName;
  supabaseUrl: string;
  supabaseAnonKey: string;
  privacyUrl: string;
  termsUrl: string;
  supportEmail: string;
  sentryDsn: string;
  universalLinkHost: string;
  posthogKey: string;
  amplitudeKey: string;
};

function readAppEnv(): AppEnvName {
  const raw =
    process.env.EXPO_PUBLIC_APP_ENV?.trim() ||
    process.env.APP_ENV?.trim() ||
    (Constants.expoConfig?.extra as { appEnv?: string } | undefined)?.appEnv ||
    'development';
  if (raw === 'preview' || raw === 'production' || raw === 'development') {
    return raw;
  }
  return 'development';
}

/**
 * Validates public env at access time so the app can still boot without credentials
 * (useful for layout scaffolding). Call `assertEnvConfigured` before network use.
 */
export const env: PublicEnv = {
  appEnv: readAppEnv(),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || 'https://taste.app/privacy',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || 'https://taste.app/terms',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@taste.app',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '',
  universalLinkHost: process.env.EXPO_PUBLIC_UNIVERSAL_LINK_HOST?.trim() || 'taste.app',
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim() ?? '',
  amplitudeKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY?.trim() ?? '',
};

export function isEnvConfigured(): boolean {
  return (
    Boolean(env.supabaseUrl && env.supabaseAnonKey) && !env.supabaseUrl.includes('your-project')
  );
}

export function assertEnvConfigured(): void {
  if (!isEnvConfigured()) {
    throw new Error(
      'Missing Supabase env. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
}

export type EnvValidationIssue = {
  level: 'error' | 'warning';
  key: string;
  message: string;
};

/** Soft audit of public configuration — safe to run in Settings / release checks. */
export function validatePublicEnv(): EnvValidationIssue[] {
  const issues: EnvValidationIssue[] = [];

  if (!env.supabaseUrl) {
    issues.push({
      level: 'error',
      key: 'EXPO_PUBLIC_SUPABASE_URL',
      message: 'Required for auth and data.',
    });
  } else if (!env.supabaseUrl.startsWith('https://')) {
    issues.push({
      level: 'error',
      key: 'EXPO_PUBLIC_SUPABASE_URL',
      message: 'Must be an https URL.',
    });
  }

  if (!env.supabaseAnonKey) {
    issues.push({
      level: 'error',
      key: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      message: 'Required for auth and data.',
    });
  }

  if (env.appEnv === 'production' && !env.sentryDsn) {
    issues.push({
      level: 'warning',
      key: 'EXPO_PUBLIC_SENTRY_DSN',
      message: 'Crash reporting is not configured for production.',
    });
  }

  if (!env.privacyUrl.startsWith('https://')) {
    issues.push({
      level: 'warning',
      key: 'EXPO_PUBLIC_PRIVACY_URL',
      message: 'Privacy policy URL should be https.',
    });
  }

  if (!env.termsUrl.startsWith('https://')) {
    issues.push({
      level: 'warning',
      key: 'EXPO_PUBLIC_TERMS_URL',
      message: 'Terms URL should be https.',
    });
  }

  const network = auditNetworkSecurity({
    supabaseUrl: env.supabaseUrl,
    configured: isEnvConfigured(),
    appEnv: env.appEnv,
  });
  for (const issue of network) {
    issues.push({
      level: issue.level,
      key: 'NETWORK',
      message: issue.message,
    });
  }

  return issues;
}

export function isProductionBuild(): boolean {
  return env.appEnv === 'production' && !__DEV__;
}
