# Taste Supabase

Database migrations, RLS, storage policies, and RPCs for the Taste mobile app.

## Migration files (apply in order)

1. `20260714000001_extensions_helpers.sql`
2. `20260714000002_lookup_tables.sql`
3. `20260714000003_profiles_preferences.sql`
4. `20260714000004_designs.sql`
5. `20260714000005_swipes_collections.sql`
6. `20260714000006_social_moderation.sql`
7. `20260714000007_rls_policies.sql`
8. `20260714000008_storage.sql`
9. `20260714000009_rpc_functions.sql`
10. `20260714000010_seed_categories_tags.sql`
11. `20260714000011_recommendation_ranking.sql`

## Apply migrations

### Option A — Supabase CLI (recommended)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — Local Supabase

```bash
supabase start
supabase db reset
```

### Option C — SQL Editor

Paste each migration file into the Supabase Dashboard SQL editor in the order above.

## Environment variables

Mobile app (public only — never ship the service-role key):

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Server / CI only (never commit, never add to Expo):

```bash
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=   # CLI auth if needed
```

## Storage buckets

Migrations create:

| Bucket | Public | Path convention | Max size |
| --- | --- | --- | --- |
| `avatars` | yes | `{user_id}/avatar.webp` | 5 MB |
| `design-images` | yes | `{user_id}/{design_id}/1.webp` | 15 MB |

Upload paths must start with the authenticated user’s UUID folder or the storage policy will reject the write.

## RPC functions

| Function | Purpose |
| --- | --- |
| `get_unseen_designs(limit)` | Published designs not yet swiped (legacy chronological feed) |
| `get_recommended_designs(limit, exclude_ids)` | Deterministic preference ranking for Discover |
| `record_swipe(design_id, direction)` | Atomic swipe + default save |
| `undo_last_swipe()` | Undo latest swipe + fix counts |
| `increment_design_view_count(design_id)` | View counter |
| `adjust_design_save_count(design_id, delta)` | Safe save counter |
| `add_right_swipe_to_default_collection(user_id, design_id)` | Default Saved insert |
| `add_design_to_collection(...)` | Manual collection add |
| `remove_design_from_collection(...)` | Manual collection remove |

## Bootstrap triggers

- `on_auth_user_created` → `handle_new_user()` creates `profiles`, `user_preferences`, and default `Saved` collection.
