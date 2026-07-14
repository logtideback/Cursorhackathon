import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radii } from '@/theme';

export type ImageProps = ExpoImageProps & {
  rounded?: boolean;
};

/** Thin Expo Image wrapper with Taste defaults — rectangular, cached, restrained. */
export function Image({
  rounded = false,
  style,
  contentFit = 'cover',
  transition,
  cachePolicy = 'memory-disk',
  ...rest
}: ImageProps) {
  const reducedMotion = useReducedMotion();
  const resolvedTransition = transition ?? (reducedMotion ? 0 : 200);

  return (
    <ExpoImage
      {...rest}
      contentFit={contentFit}
      transition={resolvedTransition}
      cachePolicy={cachePolicy}
      style={[styles.base, rounded && styles.rounded, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceMuted,
  },
  rounded: {
    borderRadius: radii.sm,
  },
});
