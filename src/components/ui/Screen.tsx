import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  type StyleProp,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  /** Wrap content in KeyboardAvoidingView (default when scroll). */
  keyboardAvoiding?: boolean;
}>;

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
  backgroundColor,
  keyboardAvoiding,
}: ScreenProps) {
  const { colors } = useTheme();
  const resolvedBackground = backgroundColor ?? colors.background;
  const paddingStyle = padded
    ? { paddingHorizontal: spacing.xl, paddingTop: spacing.lg }
    : undefined;
  const avoidKeyboard = keyboardAvoiding ?? scroll;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, paddingStyle, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, paddingStyle, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: resolvedBackground }, style]}
      edges={edges}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
