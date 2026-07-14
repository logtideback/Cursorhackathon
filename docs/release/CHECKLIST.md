# Taste — release / store checklist

Use this before TestFlight and Google Play internal testing, then again before public launch.

## Authentication

- [ ] Email sign-up / sign-in works on iOS and Android development builds
- [ ] Apple Sign In (iOS) completes and creates a profile row
- [ ] Session restores after cold start (SecureStore)
- [ ] Sign-out clears session and returns to auth
- [ ] Password reset email deep-links to `/(auth)/reset-password` and updates password
- [ ] Magic-link flow opens the app and establishes a session
- [ ] Auth errors show friendly copy (no raw Supabase dumps)

## Database & storage

- [ ] All migrations applied (`supabase db push` / CI)
- [ ] Row-Level Security verified for designs, collections, swipes, follows, blocks, reports
- [ ] Storage policies for `avatars`, `design-images`, `collection-covers`
- [ ] Image uploads compress, thumbnails generate, public URLs resolve
- [ ] Account deletion RPC (`delete_own_account`) removes storage objects and cascades rows
- [ ] Data-export RPC returns a summary without leaking other users’ data

## Core product

- [ ] Discover swipe right / left
- [ ] Undo last swipe when available
- [ ] Design detail: save, share, report, hide, similar
- [ ] Collections: create, edit, add/remove designs, privacy toggle, share public
- [ ] Search: landing, filters, results, empty states
- [ ] Creator profiles: follow, report, block, designs grid
- [ ] Upload wizard: validation, moderation hooks, provenance, publish
- [ ] Preferences / Taste Profile / Settings

## Safety & trust

- [ ] Report flow submits and tracks analytics (consent-gated)
- [ ] Block flow hides content and is reversible in Settings
- [ ] Account deletion: confirmation → explanation → reauth → delete → sign-out
- [ ] Partial deletion failures do not leave a usable zombie session
- [ ] Privacy policy + terms screens open; hosted URLs reachable
- [ ] Support email opens a mail draft
- [ ] Analytics only fire after consent
- [ ] Crash-reporting adapter initialises when DSN present (no PII in breadcrumbs)
- [ ] Image content-safety check flags for review without silent hard-fail in MVP

## Deep links & share

- [ ] Scheme `taste://design/{id}` opens design detail
- [ ] Universal links for `https://taste.app/…` (or your host) after AASA / assetlinks
- [ ] Password reset + magic link redirect URLs configured in Supabase Auth
- [ ] Shared collection / design messages include the correct URL for the build env

## Offline / a11y / performance

- [ ] Offline banner appears; preference queue flushes on reconnect
- [ ] Empty / error / loading states for Discover, Search, Collections
- [ ] VoiceOver / TalkBack labels on primary actions
- [ ] Reduced-motion path does not rely on essential swipe-only UX without buttons
- [ ] FlashList lists scroll smoothly with remote images
- [ ] No accidental `console.log` of tokens in production builds

## Store packaging

- [ ] App display name **Taste**
- [ ] Bundle ID / package name set (not left as placeholder if submitting)
- [ ] Icons (1024) + Android adaptive foreground/background/monochrome
- [ ] Splash screen
- [ ] App Store screenshots (required sizes)
- [ ] Play Store screenshots
- [ ] Privacy disclosures / Data safety form
- [ ] Content-rating questionnaire answered
- [ ] Test accounts for Apple review
- [ ] Support contact email
- [ ] Terms and privacy links in store listings match in-app

## Builds

- [ ] `eas build --profile development` installs with expo-dev-client
- [ ] `eas build --profile preview` internal distribution (TestFlight / Play internal or APK)
- [ ] `eas build --profile production` store-ready (AAB + iOS archive)
- [ ] EAS secrets set; no secrets in git
- [ ] `validatePublicEnv()` issues reviewed in Settings / release notes
