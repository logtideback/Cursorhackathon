import { resetAnalytics } from '@/lib/analytics';
import { crashReporting } from '@/lib/crash-reporting';
import { assertEnvConfigured } from '@/lib/env';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { signInWithEmail, signOut } from '@/services/auth';

export type AccountDeletionResult =
  | { ok: true; deletedDesigns: number; deletedStorageObjects: number }
  | { ok: false; stage: string; message: string };

export type DataExportRequest = {
  requestedAt: string;
  status: string;
  message: string;
  counts?: Record<string, number>;
};

/**
 * Account deletion policy (store-ready):
 * 1. Confirm in UI
 * 2. Reauthenticate with password
 * 3. Best-effort client storage cleanup for remaining local paths
 * 4. Call SECURITY DEFINER RPC to remove storage objects + auth user (cascade)
 * 5. Reset analytics and local session
 * 6. Surface partial-failure details without leaving a half-signed-in state when possible
 */
export async function deleteAccountWithReauth(params: {
  email: string;
  password: string;
}): Promise<AccountDeletionResult> {
  assertEnvConfigured();

  try {
    await signInWithEmail(params.email, params.password);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reauthentication failed.';
    return { ok: false, stage: 'reauthenticate', message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      stage: 'session',
      message: 'No authenticated session after reauthentication.',
    };
  }

  try {
    await cleanupOwnStorageFolders(user.id);
  } catch (error) {
    // Non-fatal — RPC also deletes storage.objects by prefix.
    logger.warn('Client storage cleanup incomplete', error);
    crashReporting.addBreadcrumb('account_deletion_storage_cleanup_partial');
  }

  const { data, error } = await supabase.rpc('delete_own_account');
  if (error) {
    crashReporting.captureException(error, { stage: 'delete_own_account' });
    return {
      ok: false,
      stage: 'delete_own_account',
      message: error.message || 'Account deletion failed.',
    };
  }

  const payload = (data ?? {}) as {
    deleted_designs?: number;
    deleted_storage_objects?: number;
  };

  try {
    resetAnalytics();
    // Session may already be invalid after auth.users delete.
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    logger.warn('Post-deletion local sign-out issue', error);
  }

  return {
    ok: true,
    deletedDesigns: Number(payload.deleted_designs ?? 0),
    deletedStorageObjects: Number(payload.deleted_storage_objects ?? 0),
  };
}

async function cleanupOwnStorageFolders(userId: string): Promise<void> {
  const buckets = ['avatars', 'design-images', 'collection-covers'] as const;
  for (const bucket of buckets) {
    const { data: entries } = await supabase.storage.from(bucket).list(userId, { limit: 100 });
    if (!entries?.length) {
      continue;
    }
    const paths: string[] = [];
    for (const entry of entries) {
      if (entry.id) {
        paths.push(`${userId}/${entry.name}`);
        continue;
      }
      const { data: nested } = await supabase.storage
        .from(bucket)
        .list(`${userId}/${entry.name}`, { limit: 100 });
      for (const child of nested ?? []) {
        if (child.id) {
          paths.push(`${userId}/${entry.name}/${child.name}`);
        }
      }
    }
    if (paths.length) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}

/** Placeholder export request — returns an immediate JSON summary. */
export async function requestDataExport(): Promise<DataExportRequest> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('request_data_export');
  if (error) {
    throw error;
  }
  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    requestedAt: String(payload.requested_at ?? new Date().toISOString()),
    status: String(payload.status ?? 'queued'),
    message: String(payload.message ?? 'Export queued.'),
    counts: (payload.counts as Record<string, number> | undefined) ?? undefined,
  };
}

export async function safeSignOutAfterFailure(): Promise<void> {
  try {
    await signOut();
  } catch {
    await supabase.auth.signOut({ scope: 'local' });
    resetAnalytics();
  }
}
