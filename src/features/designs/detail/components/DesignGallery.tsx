import { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text } from '@/components';
import { GALLERY_ASPECT_RATIO, MIN_TOUCH_TARGET } from '@/features/designs/detail/constants';
import type { DesignImage } from '@/features/designs/detail/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { animation, colors, spacing } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type DesignGalleryProps = {
  images: DesignImage[];
  title: string;
};

function ZoomableImage({
  uri,
  accessibilityLabel,
  width,
  height,
  enableGestures,
}: {
  uri: string;
  accessibilityLabel: string;
  width: number;
  height: number;
  enableGestures: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const [failed, setFailed] = useState(false);

  const pinch = Gesture.Pinch()
    .enabled(enableGestures)
    .onUpdate((event) => {
      scale.value = Math.min(4, Math.max(1, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        const duration = reducedMotion ? 0 : animation.duration.fast;

        scale.value = withTiming(1, { duration });

        savedScale.value = 1;

        translateX.value = withTiming(0, { duration });

        translateY.value = withTiming(0, { duration });

        savedX.value = 0;

        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .enabled(enableGestures)
    .onUpdate((event) => {
      if (scale.value <= 1) {
        return;
      }

      translateX.value = savedX.value + event.translationX;

      translateY.value = savedY.value + event.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;

      savedY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (failed || !uri) {
    return (
      <View
        style={[styles.fallback, { width, height }]}
        accessibilityLabel={`${accessibilityLabel} unavailable`}
      >
        <Text variant="caption" tone="secondary">
          Image unavailable
        </Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width, height }, animatedStyle]}>
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel}
          onError={() => setFailed(true)}
          transition={reducedMotion ? 0 : 200}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export function DesignGallery({ images, title }: DesignGalleryProps) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const galleryHeight = SCREEN_WIDTH / GALLERY_ASPECT_RATIO;
  const hasImages = images.length > 0;

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(next);
  }, []);

  if (!hasImages) {
    return (
      <View
        style={[styles.emptyGallery, { height: galleryHeight }]}
        accessibilityLabel="No design images available"
      >
        <Text variant="label" tone="tertiary">
          Imagery
        </Text>
        <Text variant="body" tone="secondary">
          No images are available for this design.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        accessibilityLabel={`Design gallery for ${title}`}
        renderItem={({ item, index: itemIndex }) => (
          <Pressable
            onPress={() => setFullscreen(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`${title} image ${itemIndex + 1} of ${images.length}. Double tap for full screen.`}
            accessibilityHint="Opens full-screen pinch-to-zoom viewer"
          >
            <ZoomableImage
              uri={item.imageUrl}
              accessibilityLabel={`${title} image ${itemIndex + 1}`}
              width={SCREEN_WIDTH}
              height={galleryHeight}
              enableGestures={false}
            />
          </Pressable>
        )}
      />

      <View style={styles.pagination} accessibilityLabel={`Image ${index + 1} of ${images.length}`}>
        {images.map((image, dotIndex) => (
          <View
            key={image.id}
            style={[styles.dot, dotIndex === index && styles.dotActive]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ))}
      </View>

      <Text variant="caption" tone="tertiary" style={styles.pageCopy}>
        {index + 1} / {images.length}
      </Text>

      <Modal
        visible={fullscreen}
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
        statusBarTranslucent
      >
        <View
          style={[styles.fullscreenRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
          <Pressable
            onPress={() => setFullscreen(false)}
            accessibilityLabel="Close full-screen image"
            style={styles.closeButton}
            hitSlop={12}
          >
            <Text variant="button" tone="inverse">
              Close
            </Text>
          </Pressable>
          <FlatList
            data={images}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            initialScrollIndex={index}
            getItemLayout={(_, itemIndex) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * itemIndex,
              index: itemIndex,
            })}
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index: itemIndex }) => (
              <View style={styles.fullscreenSlide}>
                <ZoomableImage
                  uri={item.imageUrl}
                  accessibilityLabel={`${title} full screen image ${itemIndex + 1}`}
                  width={SCREEN_WIDTH}
                  height={SCREEN_HEIGHT * 0.75}
                  enableGestures
                />
              </View>
            )}
          />
          <Text variant="caption" tone="inverse" style={styles.fullscreenHint}>
            Pinch to zoom · swipe for more
          </Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyGallery: {
    width: '100%',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceMuted,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: MIN_TOUCH_TARGET / 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    backgroundColor: colors.text,
    width: 18,
  },
  pageCopy: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  fullscreenSlide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenHint: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    opacity: 0.7,
  },
});
