import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';

import { colors, radii } from '@/theme';

export type ImageProps = ExpoImageProps & {
  rounded?: boolean;
};

/** Thin Expo Image wrapper with Taste defaults — rectangular, restrained radius. */
export function Image({
  rounded = false,
  style,
  contentFit = 'cover',
  transition = 200,
  ...rest
}: ImageProps) {
  return (
    <ExpoImage
      {...rest}
      contentFit={contentFit}
      transition={transition}
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
