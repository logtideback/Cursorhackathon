import { router } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';

import { Screen, Text } from '@/components';
import { CollectionForm } from '@/features/collections/components/CollectionForm';
import { useCollectionMutations } from '@/features/collections/hooks/useCollectionsOverview';
import { track } from '@/lib/analytics';
import { isEnvConfigured } from '@/lib/env';
import { uploadCollectionCover } from '@/services/collections';
import { useAuthStore } from '@/store/auth-store';
import { spacing } from '@/theme';

export function CreateCollectionScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const { createMutation } = useCollectionMutations();

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        New
      </Text>
      <Text variant="heading">Create collection</Text>
      <Text variant="body" tone="secondary">
        Name it clearly. Keep it private until you are ready to share.
      </Text>

      <CollectionForm
        mode="create"
        loading={createMutation.isPending}
        onPickCoverUpload={
          isEnvConfigured() && userId
            ? async (localUri) => uploadCollectionCover(localUri, userId, `draft-${Date.now()}`)
            : undefined
        }
        onSubmit={async (input) => {
          const created = await createMutation.mutateAsync({
            name: input.name!,
            description: input.description ?? null,
            isPrivate: input.isPrivate ?? true,
            coverImageUrl: input.coverImageUrl ?? null,
          });
          track({
            name: 'collection_created',
            properties: {
              collectionId: created.id,
              isPrivate: Boolean(created.is_private),
            },
          });
          Alert.alert('Collection created', created.name);
          router.replace(`/collection/${created.id}`);
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
