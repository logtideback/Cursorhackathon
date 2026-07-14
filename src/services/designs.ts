import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type {
  RecordSwipeResult,
  SwipeDirection,
  UndoSwipeResult,
  UnseenDesignRow,
} from '@/types/database';

function requireData<T>(
  data: T | null,
  error: { message: string } | null,
  fallbackMessage: string,
): T {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
  if (data === null) {
    throw new Error(fallbackMessage);
  }
  return data;
}

export async function fetchUnseenDesigns(limit = 20): Promise<UnseenDesignRow[]> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('get_unseen_designs', { p_limit: limit });
  return requireData(data, error, 'Failed to fetch unseen designs');
}

export async function recordSwipe(
  designId: string,
  direction: SwipeDirection,
): Promise<RecordSwipeResult> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('record_swipe', {
    p_design_id: designId,
    p_direction: direction,
  });
  const result = requireData(data, error, 'Failed to record swipe');
  return result as unknown as RecordSwipeResult;
}

export async function undoLastSwipe(): Promise<UndoSwipeResult> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('undo_last_swipe');
  const result = requireData(data, error, 'Failed to undo swipe');
  return result as unknown as UndoSwipeResult;
}

export async function incrementDesignViewCount(designId: string): Promise<number> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('increment_design_view_count', {
    p_design_id: designId,
  });
  return requireData(data, error, 'Failed to increment view count');
}
