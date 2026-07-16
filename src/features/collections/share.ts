import { track } from '@/lib/analytics';
import { buildCollectionDeepLink } from '@/lib/deep-links';
import { shareContent } from '@/utils/share';

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

  const result = await shareContent({
    message,
    url,
    title: params.name,
    dialogTitle: 'Share collection',
    subject: params.name,
  });

  if (result !== 'unavailable') {
    track({
      name: 'collection_shared',
      properties: { collectionId: params.collectionId, isPrivate: params.isPrivate },
    });
  }

  return result;
}
