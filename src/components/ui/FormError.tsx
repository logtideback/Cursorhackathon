import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

type FormErrorProps = {
  message?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function FormError({ message, style }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[styles.root, style]}
    >
      <Text variant="caption" tone="danger">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: spacing.xs,
  },
});
