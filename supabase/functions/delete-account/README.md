# delete-account Edge Function

Optional alternative to the SQL RPC `public.delete_own_account()`.

Use this when hosted Supabase refuses `DELETE FROM auth.users` inside a `SECURITY DEFINER` function and you need the **service role** (set only as a Supabase secret — never in the Expo app).

## Deploy

```bash
supabase functions deploy delete-account
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=…
```

## Auth

Caller must send `Authorization: Bearer <user access_token>`.

See `index.ts` (Deno runtime; excluded from the Expo TypeScript / ESLint project).
