import { emitModerationHook } from '@/lib/content-moderation';
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

  void emitModerationHook({
    event: 'report_submitted',
    targetKind: 'design',
    targetId: params.designId,
    reason: params.reason,
    reporterId: user.id,
  });

  return data;
}

export async function recordDesignFeedback(params: {
  designId: string;
  feedbackType: 'show_less' | 'hide_creator' | 'hide_tag' | 'hide_style';
  metadata?: Record<string, string>;
}): Promise<Tables<'design_feedback'>> {
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
    .from('design_feedback')
    .insert({
      user_id: user.id,
      design_id: params.designId,
      feedback_type: params.feedbackType,
      metadata: params.metadata ?? {},
    })
    .select('*')
    .single();

  throwOnError(error, 'Failed to record feedback');
  if (!data) {
    throw new Error('Failed to record feedback');
  }
  return data;
}

export async function blockCreator(blockedId: string): Promise<Tables<'blocks'>> {
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
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: blockedId })
    .select('*')
    .single();

  throwOnError(error, 'Failed to block creator');
  if (!data) {
    throw new Error('Failed to block creator');
  }

  void emitModerationHook({
    event: 'user_blocked',
    targetKind: 'creator',
    targetId: blockedId,
    reporterId: user.id,
  });

  return data;
}

export async function unblockCreator(blockedId: string): Promise<void> {
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
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId);

  throwOnError(error, 'Failed to unblock creator');
}
