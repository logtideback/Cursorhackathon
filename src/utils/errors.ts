import { PostgrestError } from '@supabase/supabase-js';

export function getErrorMessage(error: unknown, fallback = 'Unexpected error'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as PostgrestError).message;
    if (message) {
      return message;
    }
  }
  return fallback;
}
