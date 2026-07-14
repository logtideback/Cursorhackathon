import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { colors, spacing } from '@/theme';

type FilterSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FilterSection({ title, description, children }: FilterSectionProps) {
  return (
    <View style={styles.root}>
      <Text variant="label" tone="tertiary">
        {title}
      </Text>
      {description ? (
        <Text variant="caption" tone="secondary">
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

type CheckboxRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function CheckboxRow({ label, selected, onPress }: CheckboxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={[styles.box, selected && styles.boxSelected]} />
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

type RadioRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function RadioRow({ label, selected, onPress }: RadioRowProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rowSelected: {
    backgroundColor: colors.accentMuted,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  boxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  radioSelected: {
    borderColor: colors.accent,
    borderWidth: 6,
  },
});
