import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Image, Text, TextField } from '@/components';
import type { CreateCollectionInput, UpdateCollectionInput } from '@/features/collections/types';
import { createCollectionSchema, isDuplicateNameError } from '@/features/collections/validation';
import { colors, spacing } from '@/theme';
import { firstZodError } from '@/utils/validation';

type CollectionFormProps = {
  mode: 'create' | 'edit';
  initial?: {
    name: string;
    description: string | null;
    isPrivate: boolean;
    coverImageUrl: string | null;
  };
  loading?: boolean;
  onSubmit: (input: CreateCollectionInput | UpdateCollectionInput) => Promise<void>;
  onPickCoverUpload?: (localUri: string) => Promise<string>;
  allowDelete?: boolean;
  onDelete?: () => Promise<void>;
};

export function CollectionForm({
  mode,
  initial,
  loading = false,
  onSubmit,
  onPickCoverUpload,
  allowDelete = false,
  onDelete,
}: CollectionFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isPrivate, setIsPrivate] = useState(initial?.isPrivate ?? true);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initial?.coverImageUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <View style={styles.root}>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Mood boards" />
      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Optional context for this collection"
        multiline
        numberOfLines={3}
        inputStyle={styles.description}
      />

      <View style={styles.privacy}>
        <Text variant="label" tone="tertiary">
          Visibility
        </Text>
        <View style={styles.privacyActions}>
          <Button
            label="Private"
            variant={isPrivate ? 'primary' : 'secondary'}
            fullWidth={false}
            onPress={() => setIsPrivate(true)}
            style={styles.privacyButton}
          />
          <Button
            label="Public"
            variant={!isPrivate ? 'primary' : 'secondary'}
            fullWidth={false}
            onPress={() => setIsPrivate(false)}
            style={styles.privacyButton}
          />
        </View>
        <Text variant="caption" tone="secondary">
          {isPrivate
            ? 'Private collections never appear in unauthenticated share queries.'
            : 'Public collections can be shared through a Taste deep link.'}
        </Text>
      </View>

      <View style={styles.coverBlock}>
        <Text variant="label" tone="tertiary">
          Cover
        </Text>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.coverPreview} contentFit="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text variant="caption" tone="secondary">
              Optional custom cover — otherwise Taste builds a mosaic from designs.
            </Text>
          </View>
        )}
        <View style={styles.coverActions}>
          <Button
            label={coverImageUrl ? 'Change cover' : 'Add cover'}
            variant="secondary"
            loading={uploading}
            onPress={async () => {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission needed', 'Allow photo access to set a collection cover.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.85,
              });
              if (result.canceled || !result.assets[0]) {
                return;
              }
              const localUri = result.assets[0].uri;
              if (!onPickCoverUpload) {
                setCoverImageUrl(localUri);
                return;
              }
              setUploading(true);
              try {
                const remote = await onPickCoverUpload(localUri);
                setCoverImageUrl(remote);
              } catch (err) {
                Alert.alert(
                  'Upload failed',
                  err instanceof Error ? err.message : 'Could not upload cover.',
                );
              } finally {
                setUploading(false);
              }
            }}
          />
          {coverImageUrl ? (
            <Button
              label="Remove cover"
              variant="ghost"
              onPress={() => setCoverImageUrl(null)}
              disabled={uploading}
            />
          ) : null}
        </View>
      </View>

      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Button
        label={mode === 'create' ? 'Create collection' : 'Save changes'}
        loading={loading}
        onPress={async () => {
          const parsed = createCollectionSchema.safeParse({
            name,
            description,
            isPrivate,
            coverImageUrl: coverImageUrl ?? '',
          });
          if (!parsed.success) {
            setError(firstZodError(parsed.error));
            return;
          }
          setError(null);
          try {
            await onSubmit({
              name: parsed.data.name,
              description: parsed.data.description || null,
              isPrivate: parsed.data.isPrivate,
              coverImageUrl,
            });
          } catch (err) {
            setError(
              isDuplicateNameError(err)
                ? 'A collection with this name already exists.'
                : err instanceof Error
                  ? err.message
                  : 'Something went wrong.',
            );
          }
        }}
      />

      {allowDelete && onDelete ? (
        <Button
          label="Delete collection"
          variant="danger"
          disabled={loading}
          onPress={() => {
            Alert.alert(
              'Delete collection?',
              'Designs stay in other collections. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    void onDelete().catch((err) => {
                      Alert.alert(
                        'Delete failed',
                        err instanceof Error ? err.message : 'Could not delete collection.',
                      );
                    });
                  },
                },
              ],
            );
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  description: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  privacy: {
    gap: spacing.sm,
  },
  privacyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  privacyButton: {
    flex: 1,
  },
  coverBlock: {
    gap: spacing.sm,
  },
  coverPreview: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surfaceMuted,
  },
  coverPlaceholder: {
    minHeight: 96,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  coverActions: {
    gap: spacing.sm,
  },
});
