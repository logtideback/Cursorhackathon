import { StyleSheet, TextInput, View } from 'react-native';

import { PressableScale, Text } from '@/components';
import { colors, fontFamilies, fontSizes, radii, spacing } from '@/theme';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search Taste',
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View style={styles.root}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        autoFocus={autoFocus}
        accessibilityLabel="Search"
        style={styles.input}
      />
      {value ? (
        <PressableScale accessibilityLabel="Clear search" onPress={onClear} style={styles.clear}>
          <Text variant="caption" tone="secondary">
            Clear
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
  },
  clear: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
