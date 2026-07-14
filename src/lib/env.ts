type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

/**
 * Validates public env at access time so the app can still boot without credentials
 * (useful for layout scaffolding). Call `assertEnvConfigured` before network use.
 */
export const env: PublicEnv = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
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
