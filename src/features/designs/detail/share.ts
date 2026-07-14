import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { trackEvent } from '@/lib/analytics/track';

export function buildDesignShareUrl(designId: string): string {
  // Prefer a deep link when the Taste scheme is configured.
  return Linking.createURL(`design/${designId}`);
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
  creatorName?: string | null;
}): Promise<'shared' | 'dismissed' | 'unavailable'> {
  const { message, url } = buildDesignShareMessage(params);

  try {
    const result = await Share.share(
      {
        message,
        url,
        title: params.title,
      },
      {
        dialogTitle: 'Share design',
        subject: params.title,
      },
    );

    trackEvent('design_shared', {
      design_id: params.designId,
      action: result.action,
    });

    if (result.action === Share.dismissedAction) {
      return 'dismissed';
    }
    return 'shared';
  } catch {
    // Fallback copy without relying on deep-link plumbing.
    try {
      await Share.share({
        message: `Taste — ${params.title}${params.creatorName ? ` by ${params.creatorName}` : ''}`,
        title: params.title,
      });
      trackEvent('design_shared', {
        design_id: params.designId,
        action: 'fallback',
      });
      return 'shared';
    } catch {
      return 'unavailable';
    }
  }
}
