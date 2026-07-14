# Secrets (do not commit)

Store local-only credentials here. Everything under this folder except this README is gitignored.

| File | Purpose |
| --- | --- |
| `play-service-account.json` | Google Play Developer API service account (EAS Submit) |
| `*.p8` / `*.p12` | Apple signing credentials if kept locally (prefer EAS credentials) |

Set Expo/EAS secrets in the Expo dashboard or via:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://…"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "…"
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "…"
```

Never commit `SUPABASE_SERVICE_ROLE_KEY` or store console API keys.
