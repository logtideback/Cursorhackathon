import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

export async function fetchCurrentProfile(): Promise<Tables<'profiles'> | null> {
  assertEnvConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw userError;
  }
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export async function updateProfile(
  updates: TablesUpdate<'profiles'>,
): Promise<Tables<'profiles'>> {
  assertEnvConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw userError;
  }
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  assertEnvConfigured();
  const normalized = username.trim().toLowerCase();

  let query = supabase.from('profiles').select('id').eq('username', normalized).limit(1);
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const match = data?.[0];
  if (!match) {
    return true;
  }
  return Boolean(excludeUserId && match.id === excludeUserId);
}

export async function uploadAvatar(localUri: string, userId: string): Promise<string> {
  assertEnvConfigured();
  const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${extension === 'png' ? 'png' : 'jpg'}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: blob.type || 'image/jpeg',
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
