import * as Linking from 'expo-linking';

import { env } from '@/lib/env';

/**
 * Deep-link / universal-link helpers for sharing and inbound navigation.
 * Scheme: `taste://…`  Universal: `https://{host}/…`
 */

function normalizePath(path: string): string {
  return path.replace(/^\//, '');
}

/** HTTPS universal link preferred for outbound sharing (App Store / Play friendly). */
export function buildUniversalUrl(path: string): string {
  return `https://${env.universalLinkHost}/${normalizePath(path)}`;
}

/** Custom scheme URL (dev client / Expo Go / fallback). */
export function buildSchemeUrl(path: string): string {
  return Linking.createURL(normalizePath(path));
}

/**
 * Public share URL — universal link in preview/production, scheme URL in development
 * so local builds do not claim taste.app until DNS + AASA are configured.
 */
export function buildShareUrl(path: string): string {
  if (env.appEnv === 'development') {
    return buildSchemeUrl(path);
  }
  return buildUniversalUrl(path);
}

export const DeepLinkPaths = {
  design: (id: string) => `design/${id}`,
  collection: (id: string) => `collection/${id}`,
  creator: (id: string) => `creator/${id}`,
  resetPassword: 'reset-password',
  magicLink: 'magic-link',
} as const;

export function buildDesignDeepLink(designId: string): string {
  return buildShareUrl(DeepLinkPaths.design(designId));
}

export function buildCollectionDeepLink(collectionId: string): string {
  return buildShareUrl(DeepLinkPaths.collection(collectionId));
}

export function buildCreatorDeepLink(creatorId: string): string {
  return buildShareUrl(DeepLinkPaths.creator(creatorId));
}
