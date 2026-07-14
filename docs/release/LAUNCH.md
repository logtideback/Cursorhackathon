# Launch readiness — TestFlight & Play internal

## Exact EAS build commands

Prerequisites: `npm i -g eas-cli`, `eas login`, `eas build:configure` once, and secrets set
(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, optional Sentry/analytics).

Override identifiers when ready:

```bash
export IOS_BUNDLE_IDENTIFIER=app.taste.mobile
export ANDROID_PACKAGE_NAME=app.taste.mobile
export EAS_PROJECT_ID=<your-eas-project-uuid>
```

### 1. Development builds (dev client)

```bash
# iOS device (internal)
eas build --profile development --platform ios

# Android APK (internal)
eas build --profile development --platform android

# Both
eas build --profile development --platform all
```

Install the resulting build, then develop against it:

```bash
npx expo start --dev-client
```

### 2. Preview builds (TestFlight / Play internal or sideload APK)

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
eas build --profile preview --platform all
```

Submit preview iOS to TestFlight (after Apple credentials configured):

```bash
eas submit --platform ios --latest --profile production
```

Android preview profile produces an **APK** for internal sideload. For Play Console internal testing track, prefer production profile AAB or change preview to `app-bundle`.

### 3. Production builds (store)

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
eas build --profile production --platform all
```

Submit:

```bash
eas submit --platform ios --latest --profile production
eas submit --platform android --latest --profile production
```

Android submit expects `./secrets/play-service-account.json` (gitignored) or an EAS secret path.

---

## Required manual Expo & store setup

1. **Expo**
   - Create project; set `EAS_PROJECT_ID` in env / EAS
   - `eas credentials` for iOS certs + Android keystore (or let EAS manage)
   - EAS Secrets for all `EXPO_PUBLIC_*` values per environment
   - Optional: EAS Update channels (`development`, `preview`, `production`)

2. **Apple Developer / App Store Connect**
   - App record with bundle id matching `IOS_BUNDLE_IDENTIFIER`
   - Capabilities: Sign in with Apple (if used), Associated Domains
   - Privacy Nutrition Labels + App Privacy policy URL
   - TestFlight external/internal groups; demo account for review
   - Replace placeholders in `eas.json` → `submit.production.ios`

3. **Google Play Console**
   - App with application id matching `ANDROID_PACKAGE_NAME`
   - Internal testing track; upload AAB from production profile
   - Data safety form; content rating questionnaire
   - Service account JSON for Play Developer API (EAS Submit)

4. **Supabase Auth**
   - Redirect URLs: `taste://**`, `https://taste.app/**` (or your host), Expo auth callbacks
   - Password recovery template → deep link to reset-password
   - Magic link template → open app scheme / universal link
   - Apply migrations including `delete_own_account` / `request_data_export`

5. **Universal links**
   - Host `apple-app-site-association` and Android `assetlinks.json` on `EXPO_PUBLIC_UNIVERSAL_LINK_HOST`
   - Associated Domains already declared in `app.config.ts`

6. **Legal**
   - Replace in-app privacy/terms placeholders with counsel-reviewed copy
   - Host live URLs at `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_TERMS_URL`
   - Set `EXPO_PUBLIC_SUPPORT_EMAIL`

7. **Observability (optional before first internal test)**
   - Sentry project → `EXPO_PUBLIC_SENTRY_DSN` (adapter is a placeholder until `@sentry/react-native` is added)
   - Push: add `expo-notifications` + APNs/FCM via EAS

---

## Launch-readiness checklist (short)

See also full list: [`CHECKLIST.md`](./CHECKLIST.md).

- [ ] Development / preview / production builds install and boot
- [ ] Auth, reset, magic links
- [ ] RLS + storage policies
- [ ] Uploads, Discover swipe/undo, collections, search, creators
- [ ] Report / block / delete account / data export
- [ ] Deep links + share URLs
- [ ] Analytics consent + crash adapter
- [ ] Offline / a11y smoke
- [ ] Store screenshots, privacy disclosures, content rating, test accounts, support + legal links
- [ ] Secrets only in EAS / local `secrets/` (not git)

---

## Known limitations

- Crash reporting is an **adapter placeholder** until `@sentry/react-native` is installed.
- Push notifications are a **no-op adapter** until `expo-notifications` is wired.
- Image safety / duplicate / similarity checks are **mock services** that flag for review; they do not call an external moderation API.
- Data export returns an **immediate JSON summary**; email archive delivery is not implemented.
- Account deletion uses a **SECURITY DEFINER RPC** that deletes `auth.users`. Some hosts may require the Edge Function stub under `supabase/functions/delete-account` with the service role instead.
- Privacy policy and terms copy are **placeholders**.
- Universal links need DNS + AASA / assetlinks before HTTPS shares open the app.
- Bundle ID / package default to `app.taste.mobile` placeholders — replace before store listing goes public.
- Android preview builds are APKs; Play internal testing typically wants an AAB (production profile).
- OAuth-only users (Apple) need an alternate reauth path for deletion (password field assumes email/password); support-assisted deletion may be required until step-up auth is added.
