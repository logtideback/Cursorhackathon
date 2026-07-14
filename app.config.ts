import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Taste',
  slug: 'taste',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'taste',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.taste.mobile',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#F6F4F1',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    package: 'app.taste.mobile',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
    backgroundColor: '#F6F4F1',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-image',
    [
      'expo-image-picker',
      {
        photosPermission: 'Taste uses your photos for an optional profile image.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F6F4F1',
        image: './assets/splash-icon.png',
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
