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
import { fieldErrorsFromZod, firstZodError, signInSchema } from '@/utils/validation';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const onSubmit = async () => {
    setFormError(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      setFormError(firstZodError(parsed.error));
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.signInWithEmail(parsed.data.email, parsed.data.password);
      track({ name: 'sign_in_completed', properties: { method: 'email' } });
      router.replace('/');
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const onMagicLink = async () => {
    setFormError(null);
    const parsed = signInSchema.shape.email.safeParse(email);
    if (!parsed.success) {
      setFieldErrors({ email: parsed.error.issues[0]?.message ?? 'Enter a valid email.' });
      return;
    }
    setMagicLoading(true);
    try {
      await authApi.signInWithMagicLink(parsed.data);
      router.push({ pathname: '/(auth)/magic-link', params: { email: parsed.data } });
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <AuthScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Welcome back
        </Text>
        <Text variant="heading" accessibilityRole="header">
          Sign in
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
          autoComplete="password"
          textContentType="password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          placeholder="Your password"
        />
        <FormError message={formError} />
        <Button label="Sign in" loading={loading} onPress={() => void onSubmit()} />
        <Button
          label="Email me a magic link"
          variant="secondary"
          loading={magicLoading}
          onPress={() => void onMagicLink()}
        />
        <Button
          label="Forgot password?"
          variant="ghost"
          onPress={() => router.push('/(auth)/forgot-password')}
        />
      </View>

      <Divider />
      <SocialAuthButtons />

      <Button
        label="Create an account"
        variant="ghost"
        onPress={() => router.push('/(auth)/sign-up')}
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
