import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ReportReason, Tables } from '@/types/database';

function throwOnError(error: { message: string } | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function followCreator(followingId: string): Promise<Tables<'follows'>> {
  assertEnvConfigured();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  throwOnError(userError, 'Failed to resolve authenticated user');
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: followingId })
    .select('*')
    .single();

  throwOnError(error, 'Failed to follow creator');
  if (!data) {
    throw new Error('Failed to follow creator');
  }
  return data;
}

export async function unfollowCreator(followingId: string): Promise<void> {
  assertEnvConfigured();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  throwOnError(userError, 'Failed to resolve authenticated user');
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId);

  throwOnError(error, 'Failed to unfollow creator');
}

export async function isFollowingCreator(followingId: string): Promise<boolean> {
  assertEnvConfigured();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  throwOnError(userError, 'Failed to resolve authenticated user');
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .maybeSingle();

  throwOnError(error, 'Failed to check follow status');
  return Boolean(data);
}

export async function reportDesign(params: {
  designId: string;
  reason: ReportReason;
  notes?: string | null;
}): Promise<Tables<'reports'>> {
  assertEnvConfigured();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  throwOnError(userError, 'Failed to resolve authenticated user');
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      design_id: params.designId,
      reason: params.reason,
      notes: params.notes ?? null,
    })
    .select('*')
    .single();

  throwOnError(error, 'Failed to report design');
  if (!data) {
    throw new Error('Failed to report design');
  }
  return data;
}
