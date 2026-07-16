import { router } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';

import { LoadingIndicator, Screen, Text } from '@/components';
import { CollectionForm } from '@/features/collections/components/CollectionForm';
import { useCollectionDetail } from '@/features/collections/hooks/useCollectionDetail';
import { useCollectionMutations } from '@/features/collections/hooks/useCollectionsOverview';
import { isEnvConfigured } from '@/lib/env';
import { uploadCollectionCover } from '@/services/collections';
import { useAuthStore } from '@/store/auth-store';
import { spacing } from '@/theme';

type EditCollectionScreenProps = {
  collectionId: string;
};

export function EditCollectionScreen({ collectionId }: EditCollectionScreenProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const { detail, isLoading } = useCollectionDetail(collectionId);
  const { updateMutation, deleteMutation } = useCollectionMutations();

  if (isLoading || !detail) {
    return (
      <Screen>
        <LoadingIndicator label="Loading collection" />
      </Screen>
    );
  }

  const collection = detail.collection;

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Edit
      </Text>
      <Text variant="heading">{collection.name}</Text>

      <CollectionForm
        mode="edit"
        loading={updateMutation.isPending || deleteMutation.isPending}
        allowDelete={!collection.is_default}
        initial={{
          name: collection.name,
          description: collection.description,
          isPrivate: collection.is_private,
          coverImageUrl: collection.cover_image_url,
        }}
        onPickCoverUpload={
          isEnvConfigured() && userId
            ? async (localUri) => uploadCollectionCover(localUri, userId, collectionId)
            : undefined
        }
        onSubmit={async (input) => {
          await updateMutation.mutateAsync({
            collectionId,
            input: {
              name: input.name,
              description: input.description ?? null,
              isPrivate: input.isPrivate,
              coverImageUrl: input.coverImageUrl ?? null,
            },
          });
          Alert.alert('Saved', 'Collection updated.');
          router.back();
        }}
        onDelete={async () => {
          await deleteMutation.mutateAsync(collectionId);
          router.replace('/(tabs)/collections');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
});
