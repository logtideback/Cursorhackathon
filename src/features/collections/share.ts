import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { track } from '@/lib/analytics';

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
