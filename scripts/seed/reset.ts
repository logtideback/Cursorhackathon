import type { SupabaseClient } from '@supabase/supabase-js';

import { SEED_BATCH, SEED_EMAIL_DOMAIN } from './sizes';

/**
 * Removes previous Taste seed users and cascading public data.
 * Seed identity = email ends with @taste.local OR app_metadata.seed === 'true'.
 */
export async function resetSeedData(client: SupabaseClient): Promise<number> {
  const seedUserIds: string[] = [];
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed listing users for reset: ${error.message}`);
    }
    const users = data.users ?? [];
    for (const user of users) {
      const email = user.email ?? '';
      const isSeed =
        email.endsWith(`@${SEED_EMAIL_DOMAIN}`) ||
        user.app_metadata?.seed === true ||
        user.app_metadata?.seed_batch === SEED_BATCH;
      if (isSeed) {
        seedUserIds.push(user.id);
      }
    }
    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  if (seedUserIds.length === 0) {
    console.log('No seed users found — reset is a no-op.');
    return 0;
  }

  // Best-effort storage cleanup for design-images under seed user folders.
  for (const userId of seedUserIds) {
    await removeStorageFolder(client, 'design-images', userId);
    await removeStorageFolder(client, 'avatars', userId);
    await removeStorageFolder(client, 'collection-covers', userId);
  }

  for (const userId of seedUserIds) {
    const { error } = await client.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(`Failed deleting seed user ${userId}: ${error.message}`);
    }
  }

  console.log(`Reset removed ${seedUserIds.length} seed users (profiles cascade).`);
  return seedUserIds.length;
}

async function removeStorageFolder(
  client: SupabaseClient,
  bucket: string,
  folder: string,
): Promise<void> {
  const { data: entries, error } = await client.storage.from(bucket).list(folder, {
    limit: 1000,
  });
  if (error || !entries?.length) {
    return;
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.id) {
      files.push(`${folder}/${entry.name}`);
      continue;
    }
    // Nested folder — list one level deep for design folders.
    const { data: nested } = await client.storage.from(bucket).list(`${folder}/${entry.name}`, {
      limit: 1000,
    });
    for (const child of nested ?? []) {
      if (child.id) {
        files.push(`${folder}/${entry.name}/${child.name}`);
      }
    }
  }

  if (files.length > 0) {
    await client.storage.from(bucket).remove(files);
  }
}
