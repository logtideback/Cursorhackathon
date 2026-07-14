import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, Button, FormError, Text, TextField } from '@/components';
import { isEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme';
import { friendlyAuthError } from '@/utils/auth-errors';

/**
 * Destination for password-reset deep links (`taste://reset-password`).
 */
export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!isEnvConfigured()) {
      setError('Password reset requires a configured backend.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }
      setDone(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Security
        </Text>
        <Text variant="heading" accessibilityRole="header">
          Choose a new password
        </Text>
        <Text variant="body" tone="secondary">
          You opened Taste from a password-reset link. Set a new password to finish.
        </Text>
      </View>

      {done ? (
        <View style={styles.actions}>
          <Text variant="body" tone="accent">
            Password updated.
          </Text>
          <Button label="Continue" onPress={() => router.replace('/(tabs)')} />
        </View>
      ) : (
        <>
          <TextField
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="password-new"
          />
          <TextField
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            textContentType="newPassword"
          />
          <FormError message={error} />
          <View style={styles.actions}>
            <Button label="Update password" loading={busy} onPress={() => void onSubmit()} />
            <Button
              label="Back to sign in"
              variant="ghost"
              onPress={() => router.replace('/(auth)/sign-in')}
            />
          </View>
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    justifyContent: 'center',
  },
  header: {
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
});
