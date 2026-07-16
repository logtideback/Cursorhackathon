import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, Button, FormError, Text } from '@/components';
import { authApi } from '@/features/auth';
import { spacing } from '@/theme';
import { friendlyAuthError } from '@/utils/auth-errors';

export default function MagicLinkScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const displayEmail = typeof email === 'string' ? email : 'your email';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onResend = async () => {
    if (typeof email !== 'string') {
      return;
    }
    setError(null);
    setMessage(null);
    setResending(true);
    try {
      await authApi.signInWithMagicLink(email);
      setMessage('Another link is on its way.');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Magic link
        </Text>
        <Text variant="heading" accessibilityRole="header">
          Check your email
        </Text>
        <Text variant="body" tone="secondary">
          We sent a sign-in link to {displayEmail}. Open it on this device to continue.
        </Text>
      </View>

      <View style={styles.panel} accessibilityLiveRegion="polite">
        <Text variant="label" tone="tertiary">
          Waiting
        </Text>
        <Text variant="subtitle">Link expires after a short window for your security.</Text>
      </View>

      <FormError message={error} />
      {message ? (
        <Text variant="caption" tone="accent" accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Resend link"
          variant="secondary"
          loading={resending}
          disabled={typeof email !== 'string'}
          onPress={() => void onResend()}
        />
        <Button
          label="Use password instead"
          variant="ghost"
          onPress={() => router.replace('/(auth)/sign-in')}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    gap: spacing.sm,
  },
  panel: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4DFD8',
  },
  actions: {
    gap: spacing.sm,
  },
});
