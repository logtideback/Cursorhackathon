import { StyleSheet, View, ViewStyle, type StyleProp } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

type EmptyStateProps = {
  label?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  label = 'Empty',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="summary"
      accessibilityLabel={[label, title, description].filter(Boolean).join('. ')}
    >
      <Text
        variant="label"
        tone="tertiary"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {label}
      </Text>
      <Text variant="title" style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="secondary" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
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
  description: {
    maxWidth: 360,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
});
