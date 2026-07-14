import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, Button, FormError, Text, TextField } from '@/components';
import { authApi } from '@/features/auth';
import { spacing } from '@/theme';
import { friendlyAuthError } from '@/utils/auth-errors';
import { fieldErrorsFromZod, firstZodError, forgotPasswordSchema } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      setFormError(firstZodError(parsed.error));
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.sendPasswordResetEmail(parsed.data.email);
      setSent(true);
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Password
        </Text>
        <Text variant="heading" accessibilityRole="header">
          Reset your password
        </Text>
        <Text variant="body" tone="secondary">
          We will email you a secure link to choose a new password.
        </Text>
      </View>

      {sent ? (
        <View style={styles.success} accessibilityLiveRegion="polite">
          <Text variant="title">Check your inbox</Text>
          <Text variant="body" tone="secondary">
            If an account exists for {email.trim()}, a reset link is on its way.
          </Text>
          <Button label="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            placeholder="you@studio.com"
          />
          <FormError message={formError} />
          <Button label="Send reset link" loading={loading} onPress={() => void onSubmit()} />
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing['2xl'],
  },
  form: {
    gap: spacing.md,
  },
  success: {
    gap: spacing.md,
  },
});
