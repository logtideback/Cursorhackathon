// Deno Edge Function — excluded from Expo tsconfig / eslint.
// Prefer public.delete_own_account() RPC unless auth.users deletes are blocked.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Best-effort storage cleanup by user prefix (mirrors client + RPC policy).
  for (const bucket of ['avatars', 'design-images', 'collection-covers']) {
    const { data: listed } = await admin.storage.from(bucket).list(user.id, { limit: 100 });
    if (listed?.length) {
      const paths = listed.map((entry) => `${user.id}/${entry.name}`);
      await admin.storage.from(bucket).remove(paths);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
