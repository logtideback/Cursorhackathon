import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Taste Expo config for local, preview, and store builds.
 *
 * Bundle IDs / package names default to placeholders — override via:
 *   IOS_BUNDLE_IDENTIFIER, ANDROID_PACKAGE_NAME, EAS_PROJECT_ID
 * Never commit secrets. Use EAS Secrets / .env (gitignored).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
  const iosBundle = process.env.IOS_BUNDLE_IDENTIFIER?.trim() || 'app.taste.mobile';
  const androidPackage = process.env.ANDROID_PACKAGE_NAME?.trim() || 'app.taste.mobile';
  const universalHost = process.env.EXPO_PUBLIC_UNIVERSAL_LINK_HOST?.trim() || 'taste.app';

  return {
    ...config,
    name: 'Taste',
    slug: 'taste',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'taste',
    userInterfaceStyle: 'automatic',
    primaryColor: '#3E5C4A',
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundle,
      buildNumber: process.env.IOS_BUILD_NUMBER,
      associatedDomains: [`applinks:${universalHost}`, `applinks:www.${universalHost}`],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          'Taste uses your photo library so you can set a profile image or upload design work.',
        NSPhotoLibraryAddUsageDescription:
          'Taste may save compressed design images you choose to upload.',
        CFBundleDisplayName: 'Taste',
        LSApplicationQueriesSchemes: ['mailto'],
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      package: androidPackage,
      versionCode: process.env.ANDROID_VERSION_CODE
        ? Number(process.env.ANDROID_VERSION_CODE)
        : undefined,
      adaptiveIcon: {
        backgroundColor: '#F6F4F1',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: ['READ_MEDIA_IMAGES', 'INTERNET', 'ACCESS_NETWORK_STATE'],
      blockedPermissions: ['CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION'],
      allowBackup: false,
      softwareKeyboardLayoutMode: 'resize',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          category: ['BROWSABLE', 'DEFAULT'],
          data: [
            { scheme: 'https', host: universalHost, pathPrefix: '/' },
            { scheme: 'https', host: `www.${universalHost}`, pathPrefix: '/' },
            { scheme: 'taste' },
          ],
        },
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
      backgroundColor: '#F6F4F1',
      name: 'Taste',
      shortName: 'Taste',
      description:
        'Editorial discovery for interface and graphic design inspiration. Swipe to refine your taste.',
      themeColor: '#3E5C4A',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-image',
      [
        'expo-image-picker',
        {
          photosPermission: 'Taste uses your photos for profile images and design uploads.',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F6F4F1',
          image: './assets/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appEnv,
      legal: {
        privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || 'https://taste.app/privacy',
        termsUrl: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || 'https://taste.app/terms',
        supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@taste.app',
      },
      universalLinkHost: universalHost,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
      router: {},
    },
    updates: {
      url: process.env.EAS_UPDATE_URL,
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  };
};
