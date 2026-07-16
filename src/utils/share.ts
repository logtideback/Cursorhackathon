import { Platform, Share } from 'react-native';

/**
 * Cross-platform share helper.
 * Native: React Native Share sheet.
 * Web: Web Share API when available, otherwise clipboard copy.
 */
export async function shareContent(params: {
  message: string;
  url?: string;
  title?: string;
  dialogTitle?: string;
  subject?: string;
}): Promise<'shared' | 'dismissed' | 'unavailable'> {
  if (Platform.OS === 'web') {
    return shareOnWeb(params);
  }

  try {
    const result = await Share.share(
      {
        message: params.message,
        ...(params.url ? { url: params.url } : {}),
        ...(params.title ? { title: params.title } : {}),
      },
      {
        ...(params.dialogTitle ? { dialogTitle: params.dialogTitle } : {}),
        ...(params.subject ? { subject: params.subject } : {}),
      },
    );
    if (result.action === Share.dismissedAction) {
      return 'dismissed';
    }
    return 'shared';
  } catch {
    return 'unavailable';
  }
}

async function shareOnWeb(params: {
  message: string;
  url?: string;
  title?: string;
}): Promise<'shared' | 'dismissed' | 'unavailable'> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const text = params.url ? `${params.message}\n${params.url}` : params.message;

  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({
        title: params.title,
        text: params.message,
        url: params.url,
      });
      return 'shared';
    } catch (error) {
      // User cancellation is normal on the Web Share API.
      if (error instanceof Error && error.name === 'AbortError') {
        return 'dismissed';
      }
    }
  }

  if (nav?.clipboard && typeof nav.clipboard.writeText === 'function') {
    try {
      await nav.clipboard.writeText(text);
      return 'shared';
    } catch {
      // fall through
    }
  }

  return 'unavailable';
}
