import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Image, LoadingIndicator, Screen, Text, TextField } from '@/components';
import { SimilarityReview } from '@/features/upload/components/SimilarityReview';
import { UploadProgressList } from '@/features/upload/components/UploadProgressList';
import { PROVENANCE_OPTIONS, UPLOAD_STEP_COPY } from '@/features/upload/constants';
import { useUploadWizard } from '@/features/upload/hooks/useUploadWizard';
import { colors, radii, spacing } from '@/theme';

type UploadWizardScreenProps = {
  userId?: string | null;
  editingDesignId?: string | null;
};

export function UploadWizardScreen({ userId, editingDesignId = null }: UploadWizardScreenProps) {
  const wizard = useUploadWizard({ userId, editingDesignId });
  const {
    draft,
    hydrated,
    readyBanner,
    clearReadyBanner,
    error,
    similarDesigns,
    uploadProgress,
    publishing,
    currentStep,
    stepNumber,
    totalSteps,
    categories,
    platforms,
    industries,
    canLeaveSafely,
    pickImages,
    removeImage,
    moveImage,
    cropImageAt,
    setTitle,
    setDescription,
    setCategorySlug,
    setPlatform,
    setIndustry,
    setTagsFromInput,
    setProvenance,
    setSourceUrl,
    handleNext,
    goBack,
    publish,
    cancelUpload,
    saveAsDraft,
    discardDraft,
    deleteDesign,
  } = wizard;

  const confirmLeave = useCallback(() => {
    if (canLeaveSafely) {
      router.back();
      return;
    }
    Alert.alert('Leave upload?', 'Your progress can be saved as a draft.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Save draft & leave',
        onPress: () => {
          void saveAsDraft().then(() => router.back());
        },
      },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          void discardDraft().then(() => router.back());
        },
      },
    ]);
  }, [canLeaveSafely, discardDraft, saveAsDraft]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmLeave();
      return true;
    });
    return () => sub.remove();
  }, [confirmLeave]);

  if (!hydrated || !draft) {
    return (
      <Screen>
        <LoadingIndicator label="Preparing upload" />
      </Screen>
    );
  }

  const copy = UPLOAD_STEP_COPY[currentStep];
  const isEditing = Boolean(editingDesignId);

  return (
    <Screen scroll contentStyle={styles.content} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={confirmLeave} accessibilityRole="button" accessibilityLabel="Close">
          <Text variant="bodyStrong" tone="secondary">
            Close
          </Text>
        </Pressable>
        <Text variant="caption" tone="tertiary">
          Step {stepNumber} of {totalSteps}
        </Text>
        {!isEditing ? (
          <Pressable
            onPress={() => void saveAsDraft()}
            accessibilityRole="button"
            accessibilityLabel="Save draft"
          >
            <Text variant="bodyStrong" tone="accent">
              Save
            </Text>
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(stepNumber / totalSteps) * 100}%` }]} />
      </View>

      <Text variant="label" tone="tertiary">
        {copy.label}
      </Text>
      <Text variant="title">{copy.title}</Text>
      <Text variant="body" tone="secondary">
        {copy.body}
      </Text>

      {readyBanner ? (
        <Pressable onPress={clearReadyBanner}>
          <Text variant="caption" tone="accent">
            {readyBanner}
          </Text>
        </Pressable>
      ) : null}

      {currentStep === 'select' ? (
        <View style={styles.section}>
          <Button label="Choose from library" onPress={() => void pickImages()} />
          <Text variant="caption" tone="tertiary">
            JPEG, PNG, WebP, or GIF. Up to 8 images. Max 10MB each before compression.
          </Text>
        </View>
      ) : null}

      {currentStep === 'review' ? (
        <View style={styles.section}>
          {draft.images.map((image) => (
            <View key={image.localId} style={styles.imageRow}>
              <Image source={{ uri: image.thumbnailUri || image.uri }} style={styles.thumb} />
              <View style={styles.imageMeta}>
                <Text variant="caption">
                  {image.width}×{image.height}
                </Text>
                <Button
                  label="Remove"
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => removeImage(image.localId)}
                />
              </View>
            </View>
          ))}
          <Button label="Add more images" variant="secondary" onPress={() => void pickImages()} />
        </View>
      ) : null}

      {currentStep === 'reorder' ? (
        <View style={styles.section}>
          {draft.images.map((image, index) => (
            <View key={image.localId} style={styles.imageRow}>
              <Image source={{ uri: image.thumbnailUri || image.uri }} style={styles.thumb} />
              <View style={styles.imageMeta}>
                <Text variant="bodyStrong">{index === 0 ? 'Cover' : `Image ${index + 1}`}</Text>
                <View style={styles.rowActions}>
                  <Button
                    label="Up"
                    variant="ghost"
                    fullWidth={false}
                    disabled={index === 0}
                    onPress={() => moveImage(index, index - 1)}
                  />
                  <Button
                    label="Down"
                    variant="ghost"
                    fullWidth={false}
                    disabled={index === draft.images.length - 1}
                    onPress={() => moveImage(index, index + 1)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {currentStep === 'crop' ? (
        <View style={styles.section}>
          <Text variant="caption" tone="secondary">
            Center-square crop is available now. Skip any image you want unchanged.
          </Text>
          {draft.images.map((image) => (
            <View key={image.localId} style={styles.imageRow}>
              <Image source={{ uri: image.uri }} style={styles.thumb} />
              <View style={styles.imageMeta}>
                <Text variant="caption">{image.cropApplied ? 'Cropped' : 'Original framing'}</Text>
                <Button
                  label={image.cropApplied ? 'Cropped' : 'Apply square crop'}
                  variant="secondary"
                  fullWidth={false}
                  disabled={image.cropApplied}
                  onPress={() => void cropImageAt(image.localId)}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {currentStep === 'title' ? (
        <TextField
          label="Title"
          value={draft.title}
          onChangeText={setTitle}
          placeholder="Quiet SaaS empty state"
          maxLength={80}
        />
      ) : null}

      {currentStep === 'description' ? (
        <TextField
          label="Description"
          value={draft.description}
          onChangeText={setDescription}
          placeholder="What should people notice?"
          multiline
          numberOfLines={5}
          inputStyle={styles.multiline}
        />
      ) : null}

      {currentStep === 'category' ? (
        <View style={styles.optionList}>
          {categories.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setCategorySlug(option.id)}
              style={[styles.option, draft.categorySlug === option.id && styles.optionSelected]}
            >
              <Text variant="bodyStrong">{option.label}</Text>
              {option.subtitle ? (
                <Text variant="caption" tone="secondary">
                  {option.subtitle}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {currentStep === 'platform' ? (
        <View style={styles.optionList}>
          {platforms.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setPlatform(option.id)}
              style={[styles.option, draft.platform === option.id && styles.optionSelected]}
            >
              <Text variant="bodyStrong">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {currentStep === 'industry' ? (
        <View style={styles.optionList}>
          {industries.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setIndustry(option.id)}
              style={[styles.option, draft.industry === option.id && styles.optionSelected]}
            >
              <Text variant="bodyStrong">{option.label}</Text>
              {option.subtitle ? (
                <Text variant="caption" tone="secondary">
                  {option.subtitle}
                </Text>
              ) : null}
            </Pressable>
          ))}
          <Button
            label="Skip industry"
            variant="ghost"
            onPress={() => {
              setIndustry('');
              void handleNext();
            }}
          />
          {/* Empty industry is treated as skipped in publish payload. */}
        </View>
      ) : null}

      {currentStep === 'tags' ? (
        <View style={styles.section}>
          <TextField
            label="Tags"
            value={draft.tags.join(', ')}
            onChangeText={setTagsFromInput}
            placeholder="typography, empty-state, soft-shadow"
            autoCapitalize="none"
          />
          <Text variant="caption" tone="tertiary">
            Separate with commas. Up to 12 tags.
          </Text>
        </View>
      ) : null}

      {currentStep === 'provenance' ? (
        <View style={styles.optionList}>
          {PROVENANCE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setProvenance(option.value)}
              style={[styles.option, draft.provenance === option.value && styles.optionSelected]}
            >
              <Text variant="bodyStrong">{option.label}</Text>
              <Text variant="caption" tone="secondary">
                {option.body}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {currentStep === 'source' ? (
        <TextField
          label="Source URL"
          value={draft.sourceUrl}
          onChangeText={setSourceUrl}
          placeholder="https://"
          autoCapitalize="none"
          keyboardType="url"
        />
      ) : null}

      {currentStep === 'preview' ? (
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewStrip}
          >
            {draft.images.map((image) => (
              <Image
                key={image.localId}
                source={{ uri: image.thumbnailUri || image.uri }}
                style={styles.previewImage}
              />
            ))}
          </ScrollView>
          <Text variant="subtitle">{draft.title || 'Untitled'}</Text>
          {draft.description ? (
            <Text variant="body" tone="secondary">
              {draft.description}
            </Text>
          ) : null}
          <Text variant="caption" tone="tertiary">
            {[draft.categorySlug, draft.platform, draft.industry, draft.provenance]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {draft.tags.length > 0 ? (
            <Text variant="caption" tone="secondary">
              {draft.tags.join(', ')}
            </Text>
          ) : null}
          <SimilarityReview results={similarDesigns} />
        </View>
      ) : null}

      {currentStep === 'publish' ? (
        <UploadProgressList
          items={uploadProgress}
          busy={publishing}
          onCancel={cancelUpload}
          onRetry={() => {
            void publish().then((result) => {
              if (result) {
                router.replace(`/design/${result.designId}`);
              }
            });
          }}
        />
      ) : null}

      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.footer}>
        {currentStep !== 'select' && currentStep !== 'publish' ? (
          <Button label="Back" variant="ghost" onPress={goBack} disabled={publishing} />
        ) : null}

        {currentStep === 'preview' ? (
          <Button
            label={isEditing ? 'Update design' : 'Publish'}
            loading={publishing}
            disabled={publishing}
            onPress={() => {
              void publish()
                .then((result) => {
                  if (result) {
                    Alert.alert(
                      isEditing ? 'Design updated' : 'Design published',
                      'Your work is live on Taste.',
                      [
                        {
                          text: 'View design',
                          onPress: () => router.replace(`/design/${result.designId}`),
                        },
                      ],
                    );
                  }
                })
                .catch(() => undefined);
            }}
          />
        ) : currentStep === 'publish' ? null : currentStep === 'select' &&
          draft.images.length === 0 ? (
          <Button label="Choose images to continue" onPress={() => void pickImages()} />
        ) : (
          <Button label="Continue" onPress={() => void handleNext()} />
        )}

        {isEditing && editingDesignId ? (
          <Button
            label="Delete design"
            variant="ghost"
            onPress={() => {
              Alert.alert(
                'Delete this design?',
                'It will be removed from Taste. This cannot be undone from the app.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      void deleteDesign(editingDesignId).then(() => {
                        router.replace('/(tabs)/profile');
                      });
                    },
                  },
                ],
              );
            }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSpacer: {
    width: 48,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  section: {
    gap: spacing.md,
  },
  imageRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  thumb: {
    width: 72,
    height: 90,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  imageMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionList: {
    gap: spacing.sm,
  },
  option: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xxs,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewStrip: {
    gap: spacing.sm,
  },
  previewImage: {
    width: 96,
    height: 120,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
