import 'react-native-url-polyfill/auto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { env, isEnvConfigured } from '@/lib/env';
import { secureAuthStorage } from '@/lib/secure-storage';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | null = null;

/**
 * Lazily creates the Supabase client so the JS bundle can load without credentials.
 * Network calls should go through feature services after `assertEnvConfigured()`.
 * Session tokens are persisted via SecureStore where available.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  if (!isEnvConfigured()) {
    client = createClient<Database>('https://placeholder.supabase.co', 'public-anon-key', {
      auth: {
        storage: secureAuthStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    return client;
  }

  client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: secureAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase(), prop, receiver);
  },
});
