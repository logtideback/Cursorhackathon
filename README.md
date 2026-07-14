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
npm start                 # Expo dev server
npm run ios               # iOS
npm run android           # Android
npm run web               # Web
npm run lint              # ESLint
npm run format            # Prettier
npm run typecheck         # TypeScript
npm run test              # Unit tests
npm run release:check     # typecheck + lint + test
npm run eas:dev           # EAS development builds
npm run eas:preview       # EAS preview builds
npm run eas:production    # EAS production builds
```

## Store builds (TestFlight / Play internal)

Full commands, store-console setup, and known limitations:

- [`docs/release/LAUNCH.md`](./docs/release/LAUNCH.md)
- [`docs/release/CHECKLIST.md`](./docs/release/CHECKLIST.md)

```bash
eas build --profile development --platform all
eas build --profile preview --platform all
eas build --profile production --platform all
```

Never commit secrets. Use `.env` (gitignored), EAS Secrets, and `secrets/` (gitignored except README).

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

## Auth & onboarding

Unauthenticated users land on Welcome → optional carousel → Sign up / Sign in.
After authentication, incomplete profiles go through preference selection and profile setup.
`profiles.onboarding_completed` (synced into local Zustand) gates access to Discover.

Magic-link and password-reset emails must allow redirect URLs for the `taste://` scheme in the Supabase dashboard.

## Manual setup

1. Create a Supabase project and copy the URL + anon key into `.env`.
2. Enable Email auth (password + magic link / OTP) in the Supabase dashboard.
3. Add redirect URLs: `taste://magic-link`, `taste://reset-password`, and your Expo Go URL if needed.
4. Apply migrations with `supabase db push`.
5. Confirm storage buckets `avatars` and `design-images` exist.
6. Optional: create an EAS project and set `EAS_PROJECT_ID`.
7. Apply the account-deletion migration and set Auth redirect URLs for `taste://reset-password`.
8. Replace privacy/terms placeholders before public store submission (see Settings → Privacy).
