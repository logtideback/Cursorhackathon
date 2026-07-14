# Taste — architecture

Taste is an Expo Router mobile app with a Supabase backend. Feature folders own UX; `src/services` owns network I/O; Zustand holds ephemeral client state; TanStack Query caches server state.

## Layers

```text
app/                  Expo Router screens (thin route wrappers)
src/features/         Feature UI, hooks, domain logic
src/services/         Supabase RPC / table / storage calls
src/lib/              Env, analytics, deep links, crash/push adapters
src/store/            Zustand (auth, onboarding, search filters)
src/providers/        App shell (fonts, theme, auth, query, analytics)
src/components/ui/    Shared primitives (Screen, Text, Button, Image…)
src/theme/            Tokens (colour, type, space, motion, a11y)
supabase/migrations/  Schema, RLS, RPCs, storage policies
scripts/seed/         Dev seed runner (service role — never shipped)
```

## Core journey (data)

1. Auth → `profiles` row + default **Saved** collection (trigger)
2. Onboarding preferences → `user_preferences`
3. Discover → `get_recommended_designs` (server) with local scoring diversity fallback
4. Swipe right → `record_swipe` + Saved collection insert + undo window
5. Swipe left → dismissal + negative tag signal
6. Design detail → images, provenance, similar, save/report/share
7. Collections → create / edit / reorder / notes / aspect labels / share public
8. Search → unified search RPC + filters store
9. Creators → profile RPC, follow, report, block
10. Upload → Storage (`design-images`) + drafts + moderation flags

## Recommendation

Deterministic blend of:

- Selected preference categories/tags/platforms/industries/colour families
- Right- and left-swipe history
- Followed creators
- Popularity and recency
- Diversity penalties (≤2 designs / creator / batch)
- Controlled exploration level (`focused` | `balanced` | `adventurous`)
- Exclusion of already-swiped, blocked, hidden, and soft-filtered provenance

Client (`src/features/discover/recommendation`) mirrors server ranking for offline/mock.

## Security

- RLS on all user-sensitive tables (`supabase/migrations/*_rls*`, feature migrations)
- Storage ownership by user-id prefix
- Auth session via SecureStore adapter
- Public Expo env only — never `SUPABASE_SERVICE_ROLE_KEY` in the app
- Account deletion: reauth → storage cleanup → `delete_own_account` RPC → local sign-out

## Analytics

Typed event catalogue + consent gate + vendor-independent client.
Console adapter in development; PostHog/Amplitude are adapters until SDKs are added.
