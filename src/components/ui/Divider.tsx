import { StyleSheet, View, ViewStyle, type StyleProp } from 'react-native';

import { colors, spacing } from '@/theme';

type DividerProps = {
  spaced?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Divider({ spaced = true, style }: DividerProps) {
  return <View style={[styles.line, spaced && { marginVertical: spacing.xl }, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
  },
});
