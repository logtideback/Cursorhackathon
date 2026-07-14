import { StyleSheet, View, ViewStyle, type StyleProp } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

type ErrorStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  actionLabel = 'Try again',
  onAction,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.root, style]}>
      <Text variant="label" tone="tertiary">
        Error
      </Text>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" tone="secondary" style={styles.message}>
        {message}
      </Text>
      {onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing['2xl'],
  },
  title: {
    marginTop: spacing.xs,
  },
  message: {
    maxWidth: 360,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
});
