import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthScreen, Button, Text } from '@/components';
import { ONBOARDING_CAROUSEL } from '@/features/onboarding/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, spacing } from '@/theme';

const PAGE_WIDTH = Dimensions.get('window').width;

export default function CarouselScreen() {
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === ONBOARDING_CAROUSEL.length - 1;

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setIndex(Math.max(0, Math.min(next, ONBOARDING_CAROUSEL.length - 1)));
  };

  return (
    <AuthScreen scroll={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          How Taste works
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        decelerationRate="fast"
        style={styles.pager}
        accessibilityLabel="Onboarding carousel"
      >
        {ONBOARDING_CAROUSEL.map((slide) => (
          <View key={slide.key} style={[styles.page, { width: PAGE_WIDTH }]}>
            <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(280)}>
              <Text variant="label" tone="tertiary">
                {slide.label}
              </Text>
              <Text variant="heading" style={styles.title}>
                {slide.title}
              </Text>
              <Text variant="body" tone="secondary" style={styles.body}>
                {slide.body}
              </Text>
            </Animated.View>
            <View
              style={styles.visual}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <View style={styles.stripe} />
              <View style={[styles.stripe, styles.stripeMuted]} />
              <View style={[styles.stripe, styles.stripeAccent]} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityRole="tablist">
          {ONBOARDING_CAROUSEL.map((slide, i) => (
            <View
              key={slide.key}
              accessibilityLabel={`Slide ${i + 1}`}
              accessibilityState={{ selected: i === index }}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <Button
          label={isLast ? 'Create account' : 'Continue'}
          size="lg"
          onPress={() => {
            if (isLast) {
              router.push('/(auth)/sign-up');
              return;
            }
            const next = index + 1;
            scrollRef.current?.scrollTo({ x: next * PAGE_WIDTH, animated: !reducedMotion });
            setIndex(next);
          }}
        />
        <Button label="Sign in" variant="ghost" onPress={() => router.push('/(auth)/sign-in')} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  pager: {
    flexGrow: 0,
  },
  page: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
  title: {
    marginTop: spacing.md,
  },
  body: {
    marginTop: spacing.md,
    maxWidth: 340,
  },
  visual: {
    height: 160,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stripe: {
    height: 18,
    width: '72%',
    backgroundColor: colors.text,
    opacity: 0.08,
  },
  stripeMuted: {
    width: '54%',
    opacity: 0.12,
  },
  stripeAccent: {
    width: '38%',
    backgroundColor: colors.accent,
    opacity: 0.28,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },
});
