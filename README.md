# Taste

Editorial, Tinder-style discovery for interface and graphic design inspiration.
Swipe right to save a design. Swipe left to dismiss it.

Taste exists because many modern apps look visually repetitive and generic. It helps users discover distinctive visual references and refine personal design taste.

## Stack

- Expo (SDK 57) + React Native + TypeScript (strict)
- Expo Router (file-based navigation)
- Supabase (auth + data + storage)
- Zustand (client state)
- TanStack Query (server state)
- React Native Reanimated + Gesture Handler
- Expo Image + Expo Haptics
- ESLint + Prettier + Vitest

## Setup instructions

### 1. Installation

```bash
npm install
cp .env.example .env
```

### 2. Environment variables

Edit `.env` (never commit secrets):

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (`https://…`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `EXPO_PUBLIC_APP_ENV` | No | `development` \| `preview` \| `production` |
| `EXPO_PUBLIC_PRIVACY_URL` | No | Hosted privacy policy |
| `EXPO_PUBLIC_TERMS_URL` | No | Hosted terms |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | No | Support contact |
| `EXPO_PUBLIC_UNIVERSAL_LINK_HOST` | No | Default `taste.app` |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Crash-reporting adapter |
| `EXPO_PUBLIC_POSTHOG_KEY` / `EXPO_PUBLIC_AMPLITUDE_API_KEY` | No | Analytics vendors |
| `EAS_PROJECT_ID` | For EAS | Expo project UUID |
| `IOS_BUNDLE_IDENTIFIER` / `ANDROID_PACKAGE_NAME` | For stores | Default `app.taste.mobile` |

**Never** put `SUPABASE_SERVICE_ROLE_KEY` in Expo/`EXPO_PUBLIC_*`. Use it only for seeding / Edge Functions.

### 3. Supabase migrations

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Migrations live in `supabase/migrations/` (ordered `000001`…`000020`). See `supabase/README.md`.

Enable Email auth (password + magic link). Add redirect URLs:

- `taste://magic-link`
- `taste://reset-password`
- your Expo / EAS deep-link URLs

Confirm storage buckets: `avatars`, `design-images`, `collection-covers`.

### 4. Seed instructions

Server-side only (service role):

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

npm run seed:small    # quick smoke
npm run seed:medium
npm run seed:full     # ~30 creators, 150 designs, test consumers
npm run seed:reset    # remove @taste.local seed users
```

Test accounts: `supabase/seed/TEST_USERS.md`.

### 5. Run commands

```bash
npm start                 # Expo (press i / a / scan QR)
npm run ios
npm run android
npm run web
npm run typecheck
npm run lint
npm run test
npm run release:check     # typecheck + lint + test
```

### 6. EAS build commands

```bash
npm i -g eas-cli && eas login && eas build:configure

eas build --profile development --platform all
eas build --profile preview --platform all
eas build --profile production --platform all

eas submit --platform ios --latest --profile production
eas submit --platform android --latest --profile production
```

Details: [`docs/release/LAUNCH.md`](./docs/release/LAUNCH.md).

## Folder structure

```text
app/                         Expo Router routes
src/
  components/ui/             Screen, Text, Button, Image, skeletons…
  features/
    auth/ onboarding/ discover/ designs/ collections/
    search/ creators/ upload/ preferences/ profile/
    account/ legal/
  hooks/ lib/ providers/ services/ store/ theme/ types/ utils/
supabase/
  migrations/                Schema, RLS, RPCs, storage
  functions/delete-account/  Optional service-role deletion stub
  seed/                      SQL taxonomy + docs
scripts/seed/                TypeScript seed runner
docs/
  ARCHITECTURE.md
  release/CHECKLIST.md
  release/LAUNCH.md
  analytics/
assets/                      Icon, splash, Android adaptive icons
eas.json                     development / preview / production
```

## Architecture summary

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

In short: thin Expo Router screens → feature modules → typed services → Supabase with RLS. Discover uses a deterministic recommendation blend (prefs, swipes, tags, creators, popularity, recency, diversity ≤2/creator/batch, exploration). Swipes are optimistic with undo/rollback. Analytics are consent-gated and vendor-independent.

## Known limitations

- PostHog / Amplitude / Sentry / push are **adapters** until SDKs are installed
- Image safety / similarity moderation checks are **mocks** that flag for review
- In-app privacy/terms are **placeholders** until counsel-reviewed copy is hosted
- Data export returns a JSON summary (email archive worker not shipped)
- OAuth-only (Apple) account deletion needs support-assisted path (password reauth required)
- Some feature StyleSheets still hard-reference the light paper palette under dark mode
- Universal links need AASA / assetlinks on your host before HTTPS shares open the app
- Social Apple/Google buttons may show “coming soon” depending on native config

## Manual steps you must complete

1. Create Supabase project; copy URL + anon key into `.env`
2. Enable Email (+ optional Apple) auth; set redirect URLs for magic link + password reset
3. `supabase db push` all migrations
4. Run `npm run seed:small` (with service role) for realistic data
5. Create EAS project; set secrets and bundle/package identifiers
6. Host privacy + terms URLs; set `EXPO_PUBLIC_SUPPORT_EMAIL`
7. Configure App Store Connect / Play Console for internal testing
8. Replace legal placeholders before public submission

## Auth & product notes

Core journey: Welcome → Sign up → Preferences → Profile → Discover swipe → Detail → Collections → Search → Creators → Upload.

Safety: Report (`/report?designId=` / `?creatorId=`), Blocked (`/settings/blocked`), Hidden preferences (`/settings/hidden-preferences`), account deletion, analytics consent.
