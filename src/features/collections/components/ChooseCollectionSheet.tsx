import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, LoadingIndicator, Text, TextField } from '@/components';
import { CollectionCover } from '@/features/collections/components/CollectionCover';
import { MIN_TOUCH_TARGET } from '@/features/collections/constants';
import { useChooseCollection } from '@/features/collections/hooks/useChooseCollection';
import { createCollectionSchema, isDuplicateNameError } from '@/features/collections/validation';
import { colors, spacing } from '@/theme';
import { firstZodError } from '@/utils/validation';

type ChooseCollectionSheetProps = {
  visible: boolean;
  designId: string | null;
  designTitle?: string | null;
  onClose: () => void;
};

export function ChooseCollectionSheet({
  visible,
  designId,
  designTitle,
  onClose,
}: ChooseCollectionSheetProps) {
  const insets = useSafeAreaInsets();
  const { options, isLoading, toggleMutation, createMutation, pendingIds } = useChooseCollection(
    visible ? designId : null,
  );
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const resetCreate = () => {
    setCreating(false);
    setName('');
    setDescription('');
    setIsPrivate(true);
    setFormError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              resetCreate();
              onClose();
            }}
            accessibilityLabel="Dismiss choose collection sheet"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <Text variant="label" tone="tertiary">
                Organise
              </Text>
              <Text variant="title">Choose collections</Text>
              <Text variant="body" tone="secondary">
                {designTitle
                  ? `Save “${designTitle}” into one or more collections.`
                  : 'Select collections for this design.'}
              </Text>

              {isLoading ? <LoadingIndicator label="Loading collections" /> : null}

              {!isLoading
                ? options.map((option) => {
                    const pending = pendingIds.includes(option.id);
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: option.containsDesign, busy: pending }}
                        accessibilityLabel={`${option.name}${option.containsDesign ? ', selected' : ''}`}
                        disabled={toggleMutation.isPending && pending}
                        onPress={() => {
                          toggleMutation.mutate(
                            {
                              collectionId: option.id,
                              shouldContain: !option.containsDesign,
                            },
                            {
                              onError: (error) => {
                                Alert.alert(
                                  'Could not update',
                                  error instanceof Error
                                    ? error.message
                                    : 'Failed to update collection.',
                                );
                              },
                            },
                          );
                        }}
                        style={[styles.option, option.containsDesign && styles.optionSelected]}
                      >
                        <CollectionCover
                          urls={option.mosaicUrls}
                          height={56}
                          style={styles.optionCover}
                        />
                        <View style={styles.optionCopy}>
                          <Text variant="bodyStrong">{option.name}</Text>
                          <Text variant="caption" tone="secondary">
                            {option.isDefault ? 'Default' : option.isPrivate ? 'Private' : 'Public'}
                            {option.containsDesign ? ' · Already saved here' : ''}
                          </Text>
                        </View>
                        <Text
                          variant="caption"
                          tone={option.containsDesign ? 'accent' : 'tertiary'}
                        >
                          {option.containsDesign ? 'In' : 'Add'}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}

              {creating ? (
                <View style={styles.createBlock}>
                  <Text variant="label" tone="tertiary">
                    New collection
                  </Text>
                  <TextField
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Editorial refs"
                    autoFocus
                  />
                  <TextField
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Optional"
                    multiline
                  />
                  <View style={styles.privacyRow}>
                    <Button
                      label={isPrivate ? 'Private' : 'Public'}
                      variant="secondary"
                      fullWidth={false}
                      onPress={() => setIsPrivate((value) => !value)}
                    />
                    <Text variant="caption" tone="secondary" style={styles.privacyHint}>
                      {isPrivate
                        ? 'Only you can see this collection.'
                        : 'Shareable through a public Taste link.'}
                    </Text>
                  </View>
                  {formError ? (
                    <Text variant="caption" tone="danger">
                      {formError}
                    </Text>
                  ) : null}
                  <Button
                    label="Create and add"
                    loading={createMutation.isPending}
                    onPress={async () => {
                      const parsed = createCollectionSchema.safeParse({
                        name,
                        description,
                        isPrivate,
                      });
                      if (!parsed.success) {
                        setFormError(firstZodError(parsed.error));
                        return;
                      }
                      setFormError(null);
                      try {
                        await createMutation.mutateAsync({
                          name: parsed.data.name,
                          description: parsed.data.description || null,
                          isPrivate: parsed.data.isPrivate,
                        });
                        resetCreate();
                      } catch (error) {
                        setFormError(
                          isDuplicateNameError(error)
                            ? 'A collection with this name already exists.'
                            : error instanceof Error
                              ? error.message
                              : 'Could not create collection.',
                        );
                      }
                    }}
                  />
                  <Button label="Cancel" variant="ghost" onPress={resetCreate} />
                </View>
              ) : (
                <Button
                  label="New collection"
                  variant="secondary"
                  onPress={() => setCreating(true)}
                />
              )}

              <Button
                label="Done"
                variant="ghost"
                onPress={() => {
                  resetCreate();
                  onClose();
                }}
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  option: {
    minHeight: MIN_TOUCH_TARGET + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.accentMuted,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  optionCover: {
    width: 56,
    height: 56,
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  createBlock: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  privacyRow: {
    gap: spacing.sm,
  },
  privacyHint: {
    maxWidth: 320,
  },
});
