import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text, TextField } from '@/components';
import { SAVED_ASPECT_OPTIONS } from '@/features/designs/detail/constants';
import type { DesignSaveState } from '@/features/designs/detail/types';
import { track } from '@/lib/analytics';
import { colors, spacing } from '@/theme';
import type { SavedAspect, Tables } from '@/types/database';

type SaveSheetProps = {
  visible: boolean;
  designId: string;
  onClose: () => void;
  mode: 'quick-save' | 'manage';
  saveState?: DesignSaveState;
  collections: Tables<'collections'>[];
  onSaveToCollection: (params: {
    collectionId: string;
    note: string | null;
    savedAspect: SavedAspect | null;
  }) => Promise<void>;
  onRemoveFromCollection: (collectionId: string) => Promise<void>;
  onUpdateDetails: (params: {
    collectionId: string;
    note: string | null;
    savedAspect: SavedAspect | null;
  }) => Promise<void>;
  busy?: boolean;
};

type DraftState = {
  collectionId: string | null;
  note: string;
  aspect: SavedAspect | null;
  error: string | null;
};

function initialDraft(
  saveState?: DesignSaveState,
  collections: Tables<'collections'>[] = [],
): DraftState {
  const defaultCollectionId =
    saveState?.defaultCollection?.id ?? collections.find((c) => c.is_default)?.id ?? null;
  const entry = saveState?.entries.find((item) => item.collectionId === defaultCollectionId);
  return {
    collectionId: defaultCollectionId,
    note: entry?.note ?? '',
    aspect: entry?.savedAspect ?? null,
    error: null,
  };
}

function SaveSheetBody({
  designId,
  onClose,
  mode,
  saveState,
  collections,
  onSaveToCollection,
  onRemoveFromCollection,
  onUpdateDetails,
  busy = false,
}: Omit<SaveSheetProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DraftState>(() => initialDraft(saveState, collections));

  const activeCollectionId =
    draft.collectionId ??
    saveState?.defaultCollection?.id ??
    collections.find((c) => c.is_default)?.id ??
    collections[0]?.id ??
    null;

  const existingEntry = useMemo(
    () => saveState?.entries.find((entry) => entry.collectionId === activeCollectionId),
    [saveState?.entries, activeCollectionId],
  );

  const title = mode === 'quick-save' ? 'Save design' : 'Manage save';

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text variant="label" tone="tertiary">
          Collections
        </Text>
        <Text variant="title">{title}</Text>
        {saveState?.isSaved ? (
          <Text variant="body" tone="secondary">
            Already saved. Choose another collection, edit your note, or remove it.
          </Text>
        ) : (
          <Text variant="body" tone="secondary">
            Saves to your default Saved collection unless you pick another.
          </Text>
        )}

        <View style={styles.list}>
          {collections.map((collection) => {
            const selected = collection.id === activeCollectionId;
            const inCollection = saveState?.entries.some(
              (entry) => entry.collectionId === collection.id,
            );
            return (
              <Pressable
                key={collection.id}
                onPress={() => {
                  const entry = saveState?.entries.find(
                    (item) => item.collectionId === collection.id,
                  );
                  setDraft({
                    collectionId: collection.id,
                    note: entry?.note ?? '',
                    aspect: entry?.savedAspect ?? null,
                    error: null,
                  });
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${collection.name}${collection.is_default ? ', default' : ''}${inCollection ? ', already contains this design' : ''}`}
                style={[styles.collectionRow, selected && styles.collectionSelected]}
              >
                <View style={styles.collectionCopy}>
                  <Text variant="bodyStrong">{collection.name}</Text>
                  <Text variant="caption" tone="secondary">
                    {collection.is_default ? 'Default' : 'Collection'}
                    {inCollection ? ' · Contains this design' : ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text variant="label" tone="tertiary" style={styles.sectionLabel}>
          Saved for
        </Text>
        <View style={styles.aspectGrid}>
          {SAVED_ASPECT_OPTIONS.map((option) => {
            const selected = draft.aspect === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    aspect: selected ? null : option.value,
                  }))
                }
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Saved for ${option.label}`}
                style={[styles.aspectChip, selected && styles.aspectChipSelected]}
              >
                <Text variant="caption" tone={selected ? 'inverse' : 'primary'}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label="Private note"
          value={draft.note}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, note: value }))}
          placeholder="What stood out about this design?"
          multiline
          numberOfLines={3}
          containerStyle={styles.note}
          inputStyle={styles.noteInput}
        />

        {draft.error ? (
          <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {draft.error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={existingEntry ? 'Update save' : 'Save here'}
            loading={busy}
            onPress={async () => {
              if (!activeCollectionId) {
                setDraft((prev) => ({
                  ...prev,
                  error: 'Create a collection before saving.',
                }));
                return;
              }
              try {
                if (existingEntry) {
                  await onUpdateDetails({
                    collectionId: activeCollectionId,
                    note: draft.note.trim() || null,
                    savedAspect: draft.aspect,
                  });
                } else {
                  await onSaveToCollection({
                    collectionId: activeCollectionId,
                    note: draft.note.trim() || null,
                    savedAspect: draft.aspect,
                  });
                  track({
                    name: 'design_added_to_collection',
                    properties: {
                      designId,
                      collectionId: activeCollectionId,
                      isDefaultCollection: Boolean(
                        collections.find((c) => c.id === activeCollectionId)?.is_default,
                      ),
                      source: 'detail',
                    },
                  });
                }
                track({
                  name: 'design_saved',
                  properties: {
                    designId,
                    collectionId: activeCollectionId,
                    hasAspect: Boolean(draft.aspect),
                    hasNote: Boolean(draft.note.trim()),
                    source: 'detail',
                  },
                });
                onClose();
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not save this design.';
                setDraft((prev) => ({ ...prev, error: message }));
                Alert.alert('Save failed', message);
              }
            }}
          />
          {existingEntry ? (
            <Button
              label="Remove from collection"
              variant="danger"
              disabled={busy}
              onPress={async () => {
                if (!activeCollectionId) {
                  return;
                }
                try {
                  const collection = collections.find((c) => c.id === activeCollectionId);
                  await onRemoveFromCollection(activeCollectionId);
                  track({
                    name: 'design_removed_from_collection',
                    properties: {
                      designId,
                      collectionId: activeCollectionId,
                      source: 'detail',
                    },
                  });
                  if (collection?.is_default) {
                    track({
                      name: 'design_removed_from_saved',
                      properties: {
                        designId,
                        collectionId: activeCollectionId,
                        source: 'detail',
                      },
                    });
                  }
                  onClose();
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : 'Could not remove this design.';
                  setDraft((prev) => ({ ...prev, error: message }));
                  Alert.alert('Remove failed', message);
                }
              }}
            />
          ) : null}
          <Button label="Cancel" variant="ghost" onPress={onClose} disabled={busy} />
        </View>
      </ScrollView>
    </View>
  );
}

export function SaveSheet({ visible, ...props }: SaveSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={props.onClose}
          accessibilityLabel="Dismiss save sheet"
        />
        {visible ? (
          <SaveSheetBody
            key={`${props.saveState?.isSaved ? 'saved' : 'unsaved'}-${props.mode}`}
            {...props}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  list: {
    gap: spacing.sm,
  },
  collectionRow: {
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  collectionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  collectionCopy: {
    gap: spacing.xxs,
  },
  sectionLabel: {
    marginTop: spacing.sm,
  },
  aspectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  aspectChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  aspectChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  note: {
    marginTop: spacing.sm,
  },
  noteInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
