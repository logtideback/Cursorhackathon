import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AuthScreen, Button, Text } from '@/components';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { spacing } from '@/theme';

export default function WelcomeScreen() {
  const reducedMotion = useReducedMotion();
  const enter = reducedMotion ? undefined : FadeIn.duration(400);
  const enterDown = reducedMotion ? undefined : FadeInDown.duration(450).delay(80);

  return (
    <AuthScreen scroll={false} contentStyle={styles.content}>
      <Animated.View entering={enter} style={styles.brand}>
        <Text variant="label" tone="tertiary">
          Design discovery
        </Text>
        <Text variant="display" accessibilityRole="header">
          Taste
        </Text>
        <Text variant="body" tone="secondary" style={styles.lede}>
          Swipe through distinctive interface and graphic design. Save what shapes your eye — skip
          what does not.
        </Text>
      </Animated.View>

      <Animated.View entering={enterDown} style={styles.actions}>
        <Button
          label="See how it works"
          size="lg"
          onPress={() => router.push('/(auth)/carousel')}
        />
        <Button
          label="I already have an account"
          variant="ghost"
          onPress={() => router.push('/(auth)/sign-in')}
        />
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
  },
  brand: {
    gap: spacing.md,
    paddingTop: spacing['4xl'],
  },
  lede: {
    maxWidth: 320,
  },
  actions: {
    gap: spacing.sm,
  },
});
