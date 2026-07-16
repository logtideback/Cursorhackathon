import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AuthScreen,
  Button,
  Divider,
  FormError,
  SocialAuthButtons,
  Text,
  TextField,
} from '@/components';
import { authApi } from '@/features/auth';
import { track } from '@/lib/analytics';
import { spacing } from '@/theme';
import { friendlyAuthError } from '@/utils/auth-errors';
import { fieldErrorsFromZod, firstZodError, signUpSchema } from '@/utils/validation';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setFormError(null);
    const parsed = signUpSchema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      setFormError(firstZodError(parsed.error));
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const result = await authApi.signUpWithEmail(parsed.data.email, parsed.data.password);
      track({ name: 'sign_up_completed', properties: { method: 'email' } });
      if (!result.session) {
        router.push({ pathname: '/(auth)/magic-link', params: { email: parsed.data.email } });
        return;
      }
      router.replace('/');
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
          Join Taste
        </Text>
        <Text variant="heading" accessibilityRole="header">
          Create your account
        </Text>
        <Text variant="body" tone="secondary">
          Start a private library of design that sharpens your eye.
        </Text>
      </View>

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
        <TextField
          label="Password"
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          hint="At least 8 characters"
          placeholder="Create a password"
        />
        <TextField
          label="Confirm password"
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          placeholder="Repeat password"
        />
        <FormError message={formError} />
        <Button label="Create account" loading={loading} onPress={() => void onSubmit()} />
      </View>

      <Divider />
      <SocialAuthButtons />

      <Button
        label="Already have an account"
        variant="ghost"
        onPress={() => router.replace('/(auth)/sign-in')}
      />
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
});
