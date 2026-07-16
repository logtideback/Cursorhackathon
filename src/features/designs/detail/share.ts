import { Share } from 'react-native';

import { track } from '@/lib/analytics';
import { buildDesignDeepLink } from '@/lib/deep-links';
import { shareContent } from '@/utils/share';

export function buildDesignShareUrl(designId: string): string {
  return buildDesignDeepLink(designId);
}

export function buildDesignShareMessage(params: {
  title: string;
  designId: string;
  creatorName?: string | null;
}): { message: string; url: string } {
  const url = buildDesignShareUrl(params.designId);
  const byline = params.creatorName ? ` by ${params.creatorName}` : '';
  const message = `Taste — ${params.title}${byline}\n${url}`;
  return { message, url };
}

export async function shareDesign(params: {
  title: string;
  designId: string;
  creatorId?: string | null;
  creatorName?: string | null;
}): Promise<'shared' | 'dismissed' | 'unavailable'> {
  const { message, url } = buildDesignShareMessage(params);

  const result = await shareContent({
    message,
    url,
    title: params.title,
    dialogTitle: 'Share design',
    subject: params.title,
  });

  if (result !== 'unavailable') {
    track({
      name: 'design_shared',
      properties: {
        designId: params.designId,
        ...(params.creatorId ? { creatorId: params.creatorId } : {}),
        source: 'detail',
      },
    });
    return result;
  }

  // Native fallback without URL if the first share path failed.
  try {
    await Share.share({
      message: `Taste — ${params.title}${params.creatorName ? ` by ${params.creatorName}` : ''}`,
      title: params.title,
    });
    track({
      name: 'design_shared',
      properties: {
        designId: params.designId,
        ...(params.creatorId ? { creatorId: params.creatorId } : {}),
        source: 'detail',
      },
    });
    return 'shared';
  } catch {
    return 'unavailable';
  }
}
