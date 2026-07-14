# Taste

Editorial, Tinder-style discovery for interface and graphic design inspiration.
Swipe right to save a design. Swipe left to dismiss it.

## Stack

- Expo (SDK 57) + React Native + TypeScript (strict)
- Expo Router (file-based navigation)
- Supabase (auth + data)
- Zustand (client state)
- TanStack Query (server state)
- React Native Reanimated + Gesture Handler
- Expo Image + Expo Haptics
- ESLint + Prettier

## Installation

```bash
npm install
cp .env.example .env
```

Fill in Supabase values in `.env`, apply migrations (see below), then:

```bash
npm start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `EAS_PROJECT_ID` | No | EAS project id for builds |

Never put `SUPABASE_SERVICE_ROLE_KEY` in the mobile app or Expo env.

## Database migrations

See [`supabase/README.md`](./supabase/README.md). Apply in order:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## Scripts

```bash
npm start          # Expo dev server
npm run ios        # iOS
npm run android    # Android
npm run web        # Web
npm run lint       # ESLint
npm run format     # Prettier
npm run typecheck  # TypeScript
```

## Folder structure

```text
app/                      # Expo Router screens
src/
  components/ui/
  features/
  hooks/
  lib/
  providers/
  services/               # Auth + designs/swipes/collections/social
  store/
  theme/
  types/                  # Database types matching migrations
  utils/
supabase/
  migrations/             # Ordered SQL migrations
  config.toml
```

## Manual setup

1. Create a Supabase project and copy the URL + anon key into `.env`.
2. Enable Email auth in the Supabase dashboard.
3. Apply migrations with `supabase db push` (or run SQL files in order).
4. Confirm storage buckets `avatars` and `design-images` exist.
5. Optional: regenerate types with `supabase gen types typescript --linked`.
6. Optional: create an EAS project and set `EAS_PROJECT_ID`.
