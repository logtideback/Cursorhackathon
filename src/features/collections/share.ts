import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { trackEvent } from '@/lib/analytics/track';

/** Placeholder deep-link format for public collections. */
export function buildPublicCollectionShareUrl(collectionId: string): string {
  return Linking.createURL(`collection/${collectionId}`);
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
    trackEvent('collection_shared', {
      collection_id: params.collectionId,
      action: result.action,
    });
    if (result.action === Share.dismissedAction) {
      return 'dismissed';
    }
    return 'shared';
  } catch {
    try {
      await Share.share({ message: `Taste — ${params.name}`, title: params.name });
      trackEvent('collection_shared', {
        collection_id: params.collectionId,
        action: 'fallback',
      });
      return 'shared';
    } catch {
      return 'unavailable';
    }
  }
}
