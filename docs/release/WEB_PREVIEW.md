# Taste web preview

## Build

```bash
npx expo install react-dom react-native-web @expo/metro-runtime
npx expo export --platform web
```

`app.config.ts` sets `web.output` to `static`. Public Expo env vars are loaded from `.env` at export time.

## Local web

```bash
npx expo start --web
# or serve the export
npx serve dist -l 4173
```

## EAS Hosting

Requires an Expo account / `EXPO_TOKEN`:

```bash
eas login
# or: export EXPO_TOKEN=…
npx eas-cli@latest deploy
```

Without Expo credentials, the same `dist/` output can be served behind any static host or tunnel.
