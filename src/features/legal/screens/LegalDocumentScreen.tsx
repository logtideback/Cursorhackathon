import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components';
import { LEGAL, openExternalLegalUrl, openSupportEmail } from '@/lib/legal';
import { colors, spacing } from '@/theme';

type LegalDocument = 'privacy' | 'terms';

const COPY: Record<
  LegalDocument,
  { label: string; title: string; body: string[]; external: string }
> = {
  privacy: {
    label: 'Privacy',
    title: 'Privacy policy',
    external: LEGAL.privacyUrl,
    body: [
      'This is a development placeholder for the Taste privacy policy.',
      'Taste processes account credentials, preference signals, saved designs, and optional analytics events after consent.',
      'We do not sell personal data. Search queries are not stored in analytics as raw text.',
      'Replace this copy with counsel-reviewed policy text before production store submission.',
    ],
  },
  terms: {
    label: 'Terms',
    title: 'Terms of service',
    external: LEGAL.termsUrl,
    body: [
      'This is a development placeholder for the Taste terms of service.',
      'Creators must have rights to upload work and must set provenance accurately.',
      'Users must not harass others, scrape the service, or upload unlawful content.',
      'Replace this copy with counsel-reviewed terms before production store submission.',
    ],
  },
};

export function LegalDocumentScreen({ document }: { document: LegalDocument }) {
  const copy = COPY[document];

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        {copy.label}
      </Text>
      <Text variant="heading">{copy.title}</Text>
      {copy.body.map((paragraph) => (
        <Text key={paragraph} variant="body" tone="secondary" style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      <View style={styles.actions}>
        <Button
          label="Open hosted version"
          variant="secondary"
          onPress={() => {
            void openExternalLegalUrl(document).catch(() => undefined);
          }}
        />
        <Button
          label="Contact support"
          variant="ghost"
          onPress={() => {
            void openSupportEmail(`Taste ${copy.title}`).catch(() => undefined);
          }}
        />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>

      <Text variant="caption" tone="tertiary">
        Hosted URL: {copy.external}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  paragraph: {
    maxWidth: 520,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
