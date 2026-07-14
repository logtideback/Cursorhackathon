import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, type StyleProp } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}>;

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
  backgroundColor = colors.background,
}: ScreenProps) {
  const paddingStyle = padded
    ? { paddingHorizontal: spacing.xl, paddingTop: spacing.lg }
    : undefined;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor }, style]} edges={edges}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, paddingStyle, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor }, style]} edges={edges}>
      <View style={[styles.content, paddingStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
