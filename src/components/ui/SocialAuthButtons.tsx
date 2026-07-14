import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

type SocialAuthButtonsProps = {
  onApplePress?: () => void;
  onGooglePress?: () => void;
};

/** Visual placeholders — wire native SDKs when credentials are available. */
export function SocialAuthButtons({ onApplePress, onGooglePress }: SocialAuthButtonsProps) {
  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text variant="label" tone="tertiary">
        Coming soon
      </Text>
      <Button
        label="Continue with Apple"
        variant="secondary"
        disabled
        onPress={onApplePress}
        accessibilityHint="Apple Sign In will be available in a future update"
      />
      <Button
        label="Continue with Google"
        variant="secondary"
        disabled
        onPress={onGooglePress}
        accessibilityHint="Google Sign In will be available in a future update"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
});
