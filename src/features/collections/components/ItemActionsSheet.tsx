import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text, TextField } from '@/components';
import type { CollectionDesignItem } from '@/features/collections/types';
import { SAVED_ASPECT_OPTIONS } from '@/features/designs/detail/constants';
import { colors, spacing } from '@/theme';
import type { SavedAspect } from '@/types/database';

type ItemActionsSheetProps = {
  visible: boolean;
  item: CollectionDesignItem | null;
  collections: { id: string; name: string }[];
  currentCollectionId: string;
  onClose: () => void;
  onRemove: () => Promise<void>;
  onMove: (toCollectionId: string) => Promise<void>;
  onCopy: (toCollectionId: string) => Promise<void>;
  onSaveDetails: (params: {
    note: string | null;
    savedAspect: SavedAspect | null;
  }) => Promise<void>;
};

export function ItemActionsSheet({
  visible,
  item,
  collections,
  currentCollectionId,
  onClose,
  onRemove,
  onMove,
  onCopy,
  onSaveDetails,
}: ItemActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState(item?.note ?? '');
  const [aspect, setAspect] = useState<SavedAspect | null>(item?.savedAspect ?? null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'menu' | 'move' | 'copy' | 'note'>('menu');

  if (!visible || !item) {
    return null;
  }

  const otherCollections = collections.filter(
    (collection) => collection.id !== currentCollectionId,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={() => {
        setNote(item.note ?? '');
        setAspect(item.savedAspect ?? null);
        setMode('menu');
      }}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text variant="label" tone="tertiary">
              Saved design
            </Text>
            <Text variant="title">{item.title ?? 'Unavailable design'}</Text>
            {item.unavailable ? (
              <Text variant="body" tone="secondary">
                This design is no longer available. You can still remove it from the collection.
              </Text>
            ) : null}

            {mode === 'menu' ? (
              <View style={styles.actions}>
                <Button
                  label="Edit note & aspect"
                  variant="secondary"
                  onPress={() => setMode('note')}
                />
                <Button
                  label="Move to collection"
                  variant="secondary"
                  onPress={() => setMode('move')}
                />
                <Button
                  label="Copy to collection"
                  variant="secondary"
                  onPress={() => setMode('copy')}
                />
                <Button
                  label="Remove from collection"
                  variant="danger"
                  loading={busy}
                  onPress={async () => {
                    setBusy(true);
                    try {
                      await onRemove();
                      onClose();
                    } catch (error) {
                      Alert.alert(
                        'Remove failed',
                        error instanceof Error ? error.message : 'Could not remove design.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                <Button label="Close" variant="ghost" onPress={onClose} />
              </View>
            ) : null}

            {mode === 'note' ? (
              <View style={styles.actions}>
                <TextField
                  label="Private note"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  inputStyle={styles.note}
                />
                <Text variant="label" tone="tertiary">
                  Saved for
                </Text>
                <View style={styles.aspectGrid}>
                  {SAVED_ASPECT_OPTIONS.map((option) => {
                    const selected = aspect === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setAspect(selected ? null : option.value)}
                        style={[styles.aspect, selected && styles.aspectSelected]}
                        accessibilityState={{ selected }}
                      >
                        <Text variant="caption" tone={selected ? 'inverse' : 'primary'}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Button
                  label="Save details"
                  loading={busy}
                  onPress={async () => {
                    setBusy(true);
                    try {
                      await onSaveDetails({
                        note: note.trim() || null,
                        savedAspect: aspect,
                      });
                      onClose();
                    } catch (error) {
                      Alert.alert(
                        'Update failed',
                        error instanceof Error ? error.message : 'Could not update details.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                <Button label="Back" variant="ghost" onPress={() => setMode('menu')} />
              </View>
            ) : null}

            {(mode === 'move' || mode === 'copy') && (
              <View style={styles.actions}>
                <Text variant="body" tone="secondary">
                  {mode === 'move' ? 'Move this design to…' : 'Copy this design to…'}
                </Text>
                {otherCollections.length === 0 ? (
                  <Text variant="caption" tone="secondary">
                    Create another collection first.
                  </Text>
                ) : (
                  otherCollections.map((collection) => (
                    <Button
                      key={collection.id}
                      label={collection.name}
                      variant="secondary"
                      loading={busy}
                      onPress={async () => {
                        setBusy(true);
                        try {
                          if (mode === 'move') {
                            await onMove(collection.id);
                          } else {
                            await onCopy(collection.id);
                          }
                          onClose();
                        } catch (error) {
                          Alert.alert(
                            mode === 'move' ? 'Move failed' : 'Copy failed',
                            error instanceof Error
                              ? error.message
                              : 'Could not update collections.',
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  ))
                )}
                <Button label="Back" variant="ghost" onPress={() => setMode('menu')} />
              </View>
            )}
          </ScrollView>
        </View>
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
  actions: {
    gap: spacing.sm,
  },
  note: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  aspectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  aspect: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  aspectSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
