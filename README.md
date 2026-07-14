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

Fill in Supabase values in `.env`, then:

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
  (auth)/                 # Public auth routes
  (onboarding)/           # Authenticated onboarding
  (tabs)/                 # Protected main tabs
  design/                 # Design detail
  creator/                # Creator profile
  collection/             # Collection detail
src/
  components/ui/          # Reusable primitives
  features/               # Feature modules
  hooks/
  lib/                    # Env, Supabase, Query client
  providers/
  services/
  store/                  # Zustand stores
  theme/                  # Design tokens
  types/
  utils/
```

## Manual setup

1. Create a Supabase project and copy the URL + anon key into `.env`.
2. Enable Email auth in the Supabase dashboard (or your preferred providers).
3. Replace `src/types/database.ts` with generated types when tables exist:
   `npx supabase gen types typescript --project-id <id> > src/types/database.ts`
4. (Optional) Create an EAS project and set `EAS_PROJECT_ID` for cloud builds.
