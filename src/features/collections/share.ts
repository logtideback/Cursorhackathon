import { Share } from 'react-native';

import { track } from '@/lib/analytics';
import { buildCollectionDeepLink } from '@/lib/deep-links';

/** Public collection share URL (universal link or scheme by APP_ENV). */
export function buildPublicCollectionShareUrl(collectionId: string): string {
  return buildCollectionDeepLink(collectionId);
}

export async function sharePublicCollection(params: {
  collectionId: string;
  name: string;
  isPrivate: boolean;
}): Promise<'shared' | 'dismissed' | 'blocked' | 'unavailable'> {
  if (params.isPrivate) {
    return 'blocked';
  }

  const url = buildPublicCollectionShareUrl(params.collectionId);
  const message = `Taste — ${params.name}\n${url}`;

  try {
    const result = await Share.share(
      {
        message,
        url,
        title: params.name,
      },
      { dialogTitle: 'Share collection', subject: params.name },
    );
    track({
      name: 'collection_shared',
      properties: { collectionId: params.collectionId, isPrivate: params.isPrivate },
    });
    if (result.action === Share.dismissedAction) {
      return 'dismissed';
    }
    return 'shared';
  } catch {
    try {
      await Share.share({ message: `Taste — ${params.name}`, title: params.name });
      track({
        name: 'collection_shared',
        properties: { collectionId: params.collectionId, isPrivate: params.isPrivate },
      });
      return 'shared';
    } catch {
      return 'unavailable';
    }
  }
}
