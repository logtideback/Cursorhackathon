import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, FormError, Screen, Text, TextField } from '@/components';
import { crashReporting } from '@/lib/crash-reporting';
import { isEnvConfigured } from '@/lib/env';
import { LEGAL, openSupportEmail } from '@/lib/legal';
import { deleteAccountWithReauth, safeSignOutAfterFailure } from '@/services/account';
import { useAuthStore } from '@/store/auth-store';
import { colors, spacing } from '@/theme';

/**
 * Store-required account deletion flow:
 * confirm → explain scope → reauthenticate → delete → local sign-out.
 */
export function DeleteAccountScreen() {
  const email = useAuthStore((s) => s.user?.email) ?? '';
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    if (!confirmed) {
      setError('Confirm that you understand this cannot be undone.');
      return;
    }
    if (!password.trim()) {
      setError('Re-enter your password to continue.');
      return;
    }
    if (!isEnvConfigured()) {
      setError('Account deletion requires a configured backend.');
      return;
    }

    Alert.alert(
      'Delete Taste account?',
      'This permanently deletes your profile, designs, collections, swipes, follows, and uploaded images. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              setError(null);
              const result = await deleteAccountWithReauth({
                email,
                password,
              });
              setBusy(false);
              if (!result.ok) {
                crashReporting.captureMessage('account_deletion_failed', {
                  stage: result.stage,
                });
                setError(result.message);
                if (result.stage === 'delete_own_account') {
                  await safeSignOutAfterFailure();
                  router.replace('/(auth)');
                }
                return;
              }
              Alert.alert('Account deleted', 'Your Taste account has been removed.', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(auth)'),
                },
              ]);
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Account
      </Text>
      <Text variant="heading">Delete account</Text>
      <Text variant="body" tone="secondary">
        Deleting your account removes personal data associated with Taste on this service. Reports
        you filed may be retained in anonymised moderation logs where required for safety.
      </Text>
      {!email ? (
        <Text variant="caption" tone="danger">
          This session has no email/password identity. Contact {LEGAL.supportEmail} for assisted
          deletion, or sign in with email and password first.
        </Text>
      ) : null}

      <View style={styles.panel}>
        <Text variant="subtitle">What will be deleted</Text>
        <Text variant="body" tone="secondary">
          • Profile, username, and bio{'\n'}• Designs you uploaded and their images{'\n'}•
          Collections and notes{'\n'}• Swipes, follows, hides, and preference history{'\n'}• Local
          session and analytics identity
        </Text>
      </View>

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        placeholder="Re-enter your password"
        editable={Boolean(email)}
      />

      <Button
        label={confirmed ? 'Confirmed — I understand' : 'I understand this cannot be undone'}
        variant={confirmed ? 'secondary' : 'ghost'}
        onPress={() => setConfirmed((value) => !value)}
        accessibilityHint="Confirms you understand account deletion cannot be undone"
      />

      <FormError message={error} />

      <Button label="Delete my account" variant="danger" loading={busy} onPress={onDelete} />
      <Button
        label="Email support"
        variant="ghost"
        onPress={() => {
          void openSupportEmail('Taste account deletion').catch(() => undefined);
        }}
      />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  panel: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
