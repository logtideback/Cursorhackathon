import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SwipeCard } from '@/features/discover/components/SwipeCard';
import { SwipeFeedbackLabel } from '@/features/discover/components/SwipeFeedbackLabel';
import {
  NEXT_CARD_SCALE,
  SWIPE_OUT_DISTANCE_FACTOR,
  SWIPE_ROTATION_DEG,
  SWIPE_THRESHOLD,
} from '@/features/discover/constants';
import type { DiscoverCard } from '@/features/discover/types';
import { useHaptics } from '@/hooks/useHaptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { animation, colors } from '@/theme';
import type { SwipeDirection } from '@/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EXIT_X = SCREEN_WIDTH * SWIPE_OUT_DISTANCE_FACTOR;

export type SwipeDeckHandle = {
  swipe: (direction: SwipeDirection) => void;
};

type SwipeDeckProps = {
  activeCard: DiscoverCard | null;
  nextCard?: DiscoverCard | null;
  disabled?: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  onOpenDetail: (card: DiscoverCard) => void;
  onLongPressCard?: (card: DiscoverCard) => void;
};

export const SwipeDeck = forwardRef<SwipeDeckHandle, SwipeDeckProps>(function SwipeDeck(
  { activeCard, nextCard = null, disabled = false, onSwipe, onOpenDetail, onLongPressCard },
  ref,
) {
  const { haptic } = useHaptics();
  const reducedMotion = useReducedMotion();
  const dismissDuration = reducedMotion ? animation.duration.instant : animation.swipe.dismiss;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const thresholdSide = useSharedValue(0);
  const isLeaving = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    translateX.value = 0;
    translateY.value = 0;
    thresholdSide.value = 0;
    isLeaving.value = 0;
  }, [activeCard?.id, isLeaving, thresholdSide, translateX, translateY]);

  const fireLightHaptic = useCallback(() => {
    haptic('light');
  }, [haptic]);

  const completeSwipe = useCallback(
    (direction: SwipeDirection) => {
      haptic(direction === 'right' ? 'success' : 'medium');
      onSwipe(direction);
    },
    [haptic, onSwipe],
  );

  const openDetail = useCallback(() => {
    if (activeCard) {
      onOpenDetail(activeCard);
    }
  }, [activeCard, onOpenDetail]);

  const openFeedback = useCallback(() => {
    if (activeCard && onLongPressCard) {
      haptic('medium');
      onLongPressCard(activeCard);
    }
  }, [activeCard, haptic, onLongPressCard]);

  const swipeProgrammatically = useCallback(
    (direction: SwipeDirection) => {
      if (disabled || !activeCard || isLeaving.value) {
        return;
      }
      isLeaving.value = 1;
      const toX = direction === 'right' ? EXIT_X : -EXIT_X;
      translateX.value = withTiming(toX, { duration: dismissDuration }, (finished) => {
        if (finished) {
          runOnJS(completeSwipe)(direction);
        }
      });
    },
    [activeCard, completeSwipe, disabled, dismissDuration, isLeaving, translateX],
  );

  useImperativeHandle(ref, () => ({ swipe: swipeProgrammatically }), [swipeProgrammatically]);

  const pan = Gesture.Pan()
    .enabled(!disabled && Boolean(activeCard))
    .activeOffsetX([-14, 14])
    .failOffsetY([-24, 24])
    .onUpdate((event) => {
      if (isLeaving.value) {
        return;
      }
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.12;

      const side =
        translateX.value > SWIPE_THRESHOLD ? 1 : translateX.value < -SWIPE_THRESHOLD ? -1 : 0;

      if (side !== 0 && thresholdSide.value !== side) {
        thresholdSide.value = side;
        runOnJS(fireLightHaptic)();
      } else if (side === 0) {
        thresholdSide.value = 0;
      }
    })
    .onEnd(() => {
      if (isLeaving.value) {
        return;
      }

      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction: SwipeDirection = translateX.value > 0 ? 'right' : 'left';
        isLeaving.value = 1;
        const toX = direction === 'right' ? EXIT_X : -EXIT_X;
        translateX.value = withTiming(toX, { duration: dismissDuration }, (finished) => {
          if (finished) {
            runOnJS(completeSwipe)(direction);
          }
        });
        return;
      }

      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      thresholdSide.value = 0;
    });

  const tap = Gesture.Tap()
    .enabled(!disabled && Boolean(activeCard))
    .maxDuration(220)
    .onEnd(() => {
      if (isLeaving.value) {
        return;
      }
      runOnJS(openDetail)();
    });

  const longPress = Gesture.LongPress()
    .enabled(!disabled && Boolean(activeCard) && Boolean(onLongPressCard))
    .minDuration(420)
    .onStart(() => {
      if (isLeaving.value) {
        return;
      }
      runOnJS(openFeedback)();
    });

  const gesture = Gesture.Exclusive(pan, longPress, tap);

  const activeStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-SWIPE_ROTATION_DEG, 0, SWIPE_ROTATION_DEG],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const nextStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const scale = NEXT_CARD_SCALE + (1 - NEXT_CARD_SCALE) * progress;
    return {
      transform: [{ scale }],
    };
  });

  if (!activeCard) {
    return <View style={styles.deck} />;
  }

  return (
    <View style={styles.deck}>
      {nextCard ? (
        <Animated.View style={[styles.cardLayer, styles.nextLayer, nextStyle]}>
          <SwipeCard card={nextCard} dimmed />
        </Animated.View>
      ) : (
        <View style={[styles.cardLayer, styles.placeholder]} />
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardLayer, styles.activeLayer, activeStyle]}>
          <SwipeFeedbackLabel translateX={translateX} />
          <SwipeCard card={activeCard} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    position: 'relative',
  },
  cardLayer: {
    ...StyleSheet.absoluteFill,
  },
  nextLayer: {
    zIndex: 1,
  },
  activeLayer: {
    zIndex: 2,
  },
  placeholder: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.35,
  },
});
