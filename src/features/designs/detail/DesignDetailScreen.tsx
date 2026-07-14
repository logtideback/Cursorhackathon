import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingIndicator, Screen, Text } from '@/components';
import { ChooseCollectionSheet } from '@/features/collections';
import { CreatorSummary } from '@/features/designs/detail/components/CreatorSummary';
import { DesignActions } from '@/features/designs/detail/components/DesignActions';
import { DesignGallery } from '@/features/designs/detail/components/DesignGallery';
import { DesignMetadata } from '@/features/designs/detail/components/DesignMetadata';
import { ProvenanceLabel } from '@/features/designs/detail/components/ProvenanceLabel';
import { ReportSheet } from '@/features/designs/detail/components/ReportSheet';
import { SaveSheet } from '@/features/designs/detail/components/SaveSheet';
import { SimilarDesigns } from '@/features/designs/detail/components/SimilarDesigns';
import { SourceLinkRow } from '@/features/designs/detail/components/SourceLinkRow';
import { WhySeeingThis } from '@/features/designs/detail/components/WhySeeingThis';
import { useDesignDetail } from '@/features/designs/detail/hooks/useDesignDetail';
import { useDesignSave } from '@/features/designs/detail/hooks/useDesignSave';
import { shareDesign } from '@/features/designs/detail/share';
import { spacing } from '@/theme';

type DesignDetailScreenProps = {
  designId: string;
};

export function DesignDetailScreen({ designId }: DesignDetailScreenProps) {
  const {
    design,
    isLoading,
    offline,
    errorKind,
    refetch,
    similar,
    similarLoading,
    similarError,
    refetchSimilar,
    followMutation,
  } = useDesignDetail(designId);

  const { saveState, collections, saveMutation, removeMutation, updateDetailsMutation } =
    useDesignSave(designId);

  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [saveSheetMode, setSaveSheetMode] = useState<'quick-save' | 'manage'>('quick-save');
  const [reportVisible, setReportVisible] = useState(false);
  const [chooseVisible, setChooseVisible] = useState(false);

  if (isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Loading design" />
      </Screen>
    );
  }

  if (errorKind === 'offline' && !design) {
    return (
      <Screen>
        <ErrorState
          title="You’re offline"
          message="Connect to the internet to load this design."
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  if (errorKind === 'permission') {
    return (
      <Screen>
        <ErrorState
          title="Unable to open design"
          message="You don’t have permission to view this design."
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!design || errorKind === 'deleted') {
    return (
      <Screen>
        <EmptyState
          label="Design"
          title="This design is unavailable"
          description="It may have been deleted, archived, or removed from Taste."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const isSaved = Boolean(saveState?.isSaved);
  const suspended = design.creator.accountStatus === 'suspended';

  return (
    <Screen scroll padded={false} contentStyle={styles.content} edges={['left', 'right']}>
      <DesignGallery images={design.images} title={design.title} />

      <View style={styles.body}>
        {offline ? (
          <Text variant="caption" tone="secondary" style={styles.offline}>
            You’re offline — showing the last available details.
          </Text>
        ) : null}

        <DesignMetadata design={design} />

        {suspended ? (
          <View style={styles.notice}>
            <Text variant="label" tone="tertiary">
              Creator
            </Text>
            <Text variant="body" tone="secondary">
              This creator’s account is suspended. Follow and profile actions are limited.
            </Text>
          </View>
        ) : null}

        <CreatorSummary
          creator={design.creator}
          followLoading={followMutation.isPending}
          onToggleFollow={() => {
            if (suspended) {
              Alert.alert('Creator suspended', 'You can’t follow a suspended creator.');
              return;
            }
            followMutation.mutate(!design.creator.isFollowing, {
              onError: (error) => {
                Alert.alert(
                  'Follow failed',
                  error instanceof Error ? error.message : 'Could not update follow status.',
                );
              },
            });
          }}
        />

        <ProvenanceLabel provenance={design.provenance} />
        <SourceLinkRow designId={design.id} sourceUrl={design.sourceUrl} />

        <DesignActions
          isSaved={isSaved}
          saveLoading={saveMutation.isPending}
          onSave={() => {
            if (isSaved) {
              setSaveSheetMode('manage');
              setSaveSheetVisible(true);
              return;
            }
            const defaultId =
              saveState?.defaultCollection?.id ?? collections.find((c) => c.is_default)?.id;
            if (!defaultId) {
              setSaveSheetMode('quick-save');
              setSaveSheetVisible(true);
              return;
            }
            saveMutation.mutate(
              { collectionId: defaultId },
              {
                onSuccess: () => {
                  Alert.alert('Saved', 'Added to your Saved collection.');
                },
                onError: (error) => {
                  Alert.alert(
                    'Save failed',
                    error instanceof Error ? error.message : 'Could not save this design.',
                  );
                },
              },
            );
          }}
          onAddToCollection={() => {
            setChooseVisible(true);
          }}
          onShare={async () => {
            const result = await shareDesign({
              title: design.title,
              designId: design.id,
              creatorName: design.creator.displayName,
            });
            if (result === 'unavailable') {
              Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
            }
          }}
          onReport={() => setReportVisible(true)}
        />

        <WhySeeingThis designId={design.id} />

        <SimilarDesigns
          designs={similar}
          loading={similarLoading}
          error={similarError}
          onRetry={() => void refetchSimilar()}
        />
      </View>

      <SaveSheet
        visible={saveSheetVisible}
        mode={saveSheetMode}
        saveState={saveState}
        collections={collections}
        busy={saveMutation.isPending || removeMutation.isPending || updateDetailsMutation.isPending}
        onClose={() => setSaveSheetVisible(false)}
        onSaveToCollection={async (params) => {
          await saveMutation.mutateAsync(params);
        }}
        onRemoveFromCollection={async (collectionId) => {
          await removeMutation.mutateAsync(collectionId);
        }}
        onUpdateDetails={async (params) => {
          await updateDetailsMutation.mutateAsync(params);
        }}
      />

      <ReportSheet
        visible={reportVisible}
        designId={design.id}
        onClose={() => setReportVisible(false)}
      />

      <ChooseCollectionSheet
        visible={chooseVisible}
        designId={design.id}
        designTitle={design.title}
        onClose={() => setChooseVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['4xl'],
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  offline: {
    marginBottom: -spacing.md,
  },
  notice: {
    gap: spacing.sm,
  },
});
