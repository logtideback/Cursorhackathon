import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { validateSourceUrl } from '@/features/designs/detail/source-link';
import { track } from '@/lib/analytics';
import { colors, spacing } from '@/theme';

type SourceLinkRowProps = {
  designId: string;
  sourceUrl: string | null;
};

export function SourceLinkRow({ designId, sourceUrl }: SourceLinkRowProps) {
  const validated = validateSourceUrl(sourceUrl);
  const [opening, setOpening] = useState(false);

  if (validated.status === 'missing') {
    return (
      <View style={styles.root}>
        <Text variant="label" tone="tertiary">
          Source
        </Text>
        <Text variant="body" tone="secondary">
          No source link provided.
        </Text>
      </View>
    );
  }

  if (validated.status === 'invalid') {
    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text variant="label" tone="tertiary">
          Source
        </Text>
        <Text variant="body" tone="danger">
          {validated.reason}
        </Text>
        <Text variant="caption" tone="secondary">
          This link cannot be opened safely from Taste.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text variant="label" tone="tertiary">
        Source
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {validated.url}
      </Text>
      <Button
        label="Open source"
        variant="secondary"
        loading={opening}
        fullWidth={false}
        onPress={async () => {
          setOpening(true);
          try {
            const canOpen = await Linking.canOpenURL(validated.url);
            if (!canOpen) {
              Alert.alert(
                'Unable to open link',
                'This source link is not supported on this device.',
              );
              return;
            }
            await Linking.openURL(validated.url);
            track({
              name: 'source_link_opened',
              properties: { designId, hasValidUrl: true },
            });
          } catch {
            Alert.alert('Unable to open link', 'Something went wrong opening this source.');
          } finally {
            setOpening(false);
          }
        }}
        accessibilityHint="Opens the original design source in your browser"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  button: {
    alignSelf: 'flex-start',
    minWidth: 140,
  },
});
