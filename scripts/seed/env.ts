import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SeedEnv = {
  url: string;
  serviceRoleKey: string;
};

export function loadSeedEnv(): SeedEnv {
  const url =
    process.env.SUPABASE_URL?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

  if (!url || !serviceRoleKey) {
    throw new Error(
      [
        'Missing Supabase seed credentials.',
        'Set SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
        'Never put the service role key in Expo public env vars used by the mobile app.',
      ].join(' '),
    );
  }

  return { url, serviceRoleKey };
}

export function createServiceClient(env: SeedEnv): SupabaseClient {
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
