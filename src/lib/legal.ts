import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

type LegalExtra = {
  privacyUrl?: string;
  termsUrl?: string;
  supportEmail?: string;
};

function legalExtra(): LegalExtra {
  const extra = Constants.expoConfig?.extra as { legal?: LegalExtra } | undefined;
  return extra?.legal ?? {};
}

export const LEGAL = {
  get privacyUrl() {
    return (
      process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() ||
      legalExtra().privacyUrl ||
      'https://taste.app/privacy'
    );
  },
  get termsUrl() {
    return (
      process.env.EXPO_PUBLIC_TERMS_URL?.trim() ||
      legalExtra().termsUrl ||
      'https://taste.app/terms'
    );
  },
  get supportEmail() {
    return (
      process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() ||
      legalExtra().supportEmail ||
      'support@taste.app'
    );
  },
} as const;

/** Opens the platform mail client with a prefilled support draft. */
export async function openSupportEmail(subject = 'Taste support'): Promise<void> {
  const url = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    throw new Error('No mail app available on this device.');
  }
  await Linking.openURL(url);
}

export async function openExternalLegalUrl(kind: 'privacy' | 'terms'): Promise<void> {
  const url = kind === 'privacy' ? LEGAL.privacyUrl : LEGAL.termsUrl;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    throw new Error('Unable to open that link.');
  }
  await Linking.openURL(url);
}
