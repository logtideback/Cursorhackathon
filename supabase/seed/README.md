# Taste development seed data

Realistic, repeatable development data for local / staging Supabase.

## What you get (full size)

| Entity | Count |
| --- | --- |
| Creator profiles | 30 |
| Consumer (viewer) profiles | 10 |
| Design posts | 150 |
| Images per design | 2–5 (deterministic SVG placeholders in Storage) |
| Categories | 12 |
| Tags | 45 |
| Public collections | 20 |
| Extra private collections | 15 |
| Swipes / follows / saves / prefs / show-less | taste-biased, uneven |

Also includes edge cases: one-design creator, draft-only creator, suspended creator, empty public collection.

## Sizes

| Size | Creators | Designs | Consumers | Public collections |
| --- | --- | --- | --- | --- |
| `small` | 8 | 24 | 3 | 4 |
| `medium` | 16 | 80 | 6 | 10 |
| `full` | 30 | 150 | 10 | 20 |

## Prerequisites

1. Migrations applied (`supabase db reset` or `supabase db push`)
2. Service role key available **only** on the machine running the seed (never in the Expo app)

```bash
# .env.local or shell — server/dev only
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
# or: export EXPO_PUBLIC_SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

Install the runner once:

```bash
npm install
```

## Seed

```bash
# Full dataset (default)
npm run seed

# Sized runs
npm run seed:small
npm run seed:medium
npm run seed:full

# Wipe previous @taste.local seed users, then seed
npm run seed -- --size=full --reset

# Wipe only
npm run seed:reset

# If Storage uploads fail in CI, use documented remote placeholders
npm run seed -- --size=small --remote-placeholders
```

Taxonomy SQL also runs on `supabase db reset` via `supabase/seed/seed.sql` (categories + tags only). Content still requires `npm run seed`.

## Placeholder images

By default the script uploads unique SVG compositions to the `design-images` bucket:

`{creator_id}/{design_id}/{n}.svg`

No identical URLs, no scraped personal photos. If upload is unavailable, pass `--remote-placeholders` to use deterministic [placehold.co](https://placehold.co) URLs (documented royalty-free placeholder service).

## SQL helpers

| File | Purpose |
| --- | --- |
| `supabase/migrations/20260714000019_taxonomy_product_alignment.sql` | Product categories + tags |
| `supabase/seed/sql/01_taxonomy.sql` | Same taxonomy for SQL seed path |
| `supabase/seed/sql/99_reset_dev_seed.sql` | SQL wipe of `@taste.local` / `seed=true` users |
| `scripts/seed/*` | TypeScript content seed + reset |

## Test users

See [TEST_USERS.md](./TEST_USERS.md). Shared password: `TasteSeed-Dev-2026!`

## Safely reset and reseed

**Preferred (TypeScript):**

```bash
npm run seed:reset
npm run seed:full
# or one shot:
npm run seed -- --size=full --reset
```

This deletes auth users tagged as seed (`email *@taste.local` or `app_metadata.seed=true`), which cascades profiles, designs, swipes, collections, etc., and cleans seed storage folders.

**SQL alternative (Dashboard / psql):**

```bash
psql "$DATABASE_URL" -f supabase/seed/sql/99_reset_dev_seed.sql
npm run seed -- --size=full
```

**Full local database rebuild:**

```bash
supabase db reset   # migrations + taxonomy SQL seed
npm run seed:full   # users, designs, relationships
```

Do **not** run seed reset against production. The wipe targets seed emails / metadata only, but prefer a dedicated development project.
