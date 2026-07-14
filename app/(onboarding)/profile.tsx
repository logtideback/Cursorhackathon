import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, Button, FormError, Image, Text, TextField } from '@/components';
import { completeOnboarding } from '@/services/onboarding';
import { isUsernameAvailable, uploadAvatar } from '@/services/profiles';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePreferenceDraftStore } from '@/store/preference-draft-store';
import { colors, radii, spacing } from '@/theme';
import { friendlyAuthError } from '@/utils/auth-errors';
import { fieldErrorsFromZod, firstZodError, profileSetupSchema } from '@/utils/validation';

export default function ProfileSetupScreen() {
  const user = useAuthStore((s) => s.user);
  const completeLocalOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const getSelections = usePreferenceDraftStore((s) => s.asSelections);
  const resetPreferences = usePreferenceDraftStore((s) => s.reset);

  const initialDisplayName = useMemo(() => {
    const metaName = user?.user_metadata?.display_name;
    return typeof metaName === 'string' ? metaName : '';
  }, [user]);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle',
  );
  const [loading, setLoading] = useState(false);

  const normalizedUsername = username.trim().toLowerCase();

  useEffect(() => {
    if (normalizedUsername.length < 3) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setUsernameStatus('checking');
      void isUsernameAvailable(normalizedUsername, user?.id)
        .then((available) => {
          if (!cancelled) {
            setUsernameStatus(available ? 'available' : 'taken');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUsernameStatus('idle');
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedUsername, user?.id]);

  const derivedUsernameStatus =
    normalizedUsername.length < 3
      ? 'idle'
      : usernameStatus === 'checking'
        ? 'checking'
        : usernameStatus;

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Allow photo access to add a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSubmit = async () => {
    setFormError(null);
    const parsed = profileSetupSchema.safeParse({
      username,
      displayName,
      bio,
      websiteUrl,
    });

    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      setFormError(firstZodError(parsed.error));
      return;
    }

    if (derivedUsernameStatus === 'taken') {
      setFieldErrors({ username: 'That username is taken.' });
      setFormError('Choose an available username.');
      return;
    }

    if (derivedUsernameStatus === 'checking') {
      setFormError('Wait while we check username availability.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      let avatarUrl: string | null = null;
      if (avatarUri && user?.id) {
        avatarUrl = await uploadAvatar(avatarUri, user.id);
      }

      await completeOnboarding({
        ...getSelections(),
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        bio: parsed.data.bio || undefined,
        websiteUrl: parsed.data.websiteUrl || undefined,
        avatarUrl,
      });

      completeLocalOnboarding();
      resetPreferences();
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const usernameHint =
    derivedUsernameStatus === 'checking'
      ? 'Checking availability…'
      : derivedUsernameStatus === 'available'
        ? 'Username is available'
        : derivedUsernameStatus === 'taken'
          ? undefined
          : 'Lowercase letters, numbers, underscores';

  return (
    <AuthScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Profile
        </Text>
        <Text variant="heading" accessibilityRole="header">
          Introduce yourself
        </Text>
        <Text variant="body" tone="secondary">
          A light profile keeps Taste personal. Photo and bio are optional.
        </Text>
      </View>

      <View style={styles.avatarRow}>
        <View style={styles.avatarFrame}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              accessibilityLabel="Selected profile photo"
            />
          ) : (
            <Text variant="title" tone="tertiary">
              {displayName.slice(0, 1).toUpperCase() || 'T'}
            </Text>
          )}
        </View>
        <Button
          label="Add photo"
          variant="secondary"
          fullWidth={false}
          onPress={() => void pickAvatar()}
        />
      </View>

      <View style={styles.form}>
        <TextField
          label="Username"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setUsernameStatus('idle');
          }}
          error={
            fieldErrors.username ||
            (derivedUsernameStatus === 'taken' ? 'That username is taken.' : undefined)
          }
          hint={usernameHint}
          placeholder="your_studio"
        />
        <TextField
          label="Display name"
          autoComplete="name"
          textContentType="name"
          value={displayName}
          onChangeText={setDisplayName}
          error={fieldErrors.displayName}
          placeholder="How you appear"
        />
        <TextField
          label="Bio"
          multiline
          value={bio}
          onChangeText={setBio}
          error={fieldErrors.bio}
          placeholder="Designer, art director, curious observer…"
          inputStyle={{ minHeight: 88, textAlignVertical: 'top' }}
        />
        <TextField
          label="Website"
          autoCapitalize="none"
          keyboardType="url"
          textContentType="URL"
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          error={fieldErrors.websiteUrl}
          placeholder="https://"
        />
        <FormError message={formError} />
        <Button label="Enter Taste" size="lg" loading={loading} onPress={() => void onSubmit()} />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarFrame: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  form: {
    gap: spacing.md,
  },
});
