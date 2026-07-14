import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components';
import { spacing } from '@/theme';

export default function SignUpScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Join Taste
        </Text>
        <Text variant="heading">Create your account</Text>
        <Text variant="body" tone="secondary">
          Build a personal library of design inspiration.
        </Text>
      </View>

      <Button
        label="Sign up with email"
        onPress={() => {
          // Placeholder until auth forms ship
        }}
      />

      <Button
        label="Already have an account"
        variant="ghost"
        onPress={() => {
          router.replace('/(auth)/sign-in');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing['3xl'],
    marginBottom: spacing.md,
  },
});
