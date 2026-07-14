import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, Button, FormError, Text } from '@/components';
import { ColourSwatches } from '@/features/onboarding/components/ColourSwatches';
import { PlatformImageTiles } from '@/features/onboarding/components/PlatformImageTiles';
import { SelectionCards } from '@/features/onboarding/components/SelectionCards';
import { StyleTypographicGrid } from '@/features/onboarding/components/StyleTypographicGrid';
import { CATEGORIES, DESIGN_STYLES, INDUSTRIES, PLATFORMS } from '@/features/onboarding/constants';
import { usePreferenceDraftStore } from '@/store/preference-draft-store';
import { spacing } from '@/theme';

const STEPS = ['styles', 'industries', 'platforms', 'colours', 'categories'] as const;
type Step = (typeof STEPS)[number];

export default function PreferencesScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const step = STEPS[stepIndex] ?? 'styles';

  const preferredStyles = usePreferenceDraftStore((s) => s.preferredStyles);
  const preferredIndustries = usePreferenceDraftStore((s) => s.preferredIndustries);
  const preferredPlatforms = usePreferenceDraftStore((s) => s.preferredPlatforms);
  const preferredColourFamilies = usePreferenceDraftStore((s) => s.preferredColourFamilies);
  const preferredCategories = usePreferenceDraftStore((s) => s.preferredCategories);
  const toggle = usePreferenceDraftStore((s) => s.toggle);

  const selectionCount = {
    styles: preferredStyles.length,
    industries: preferredIndustries.length,
    platforms: preferredPlatforms.length,
    colours: preferredColourFamilies.length,
    categories: preferredCategories.length,
  }[step];

  const copy: Record<Step, { label: string; title: string; body: string }> = {
    styles: {
      label: 'Taste',
      title: 'Which styles pull you in?',
      body: 'Pick a few directions that feel like home. You can refine this later.',
    },
    industries: {
      label: 'Context',
      title: 'Where do you usually look?',
      body: 'Industry context helps Taste surface relevant composition patterns.',
    },
    platforms: {
      label: 'Surface',
      title: 'Which platforms matter?',
      body: 'Phone, desktop, identity, print — choose the canvases you study.',
    },
    colours: {
      label: 'Palette',
      title: 'Colour families you trust',
      body: 'Select swatches that match the mood of work you want to save.',
    },
    categories: {
      label: 'Format',
      title: 'What should fill your feed?',
      body: 'Categories shape the kinds of designs Taste brings forward first.',
    },
  };

  const onContinue = () => {
    setError(null);
    if (selectionCount < 1) {
      setError('Select at least one option to continue.');
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((value) => value + 1);
      return;
    }
    router.push('/(onboarding)/profile');
  };

  return (
    <AuthScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          {copy[step].label} · {stepIndex + 1} / {STEPS.length}
        </Text>
        <Text variant="heading" accessibilityRole="header">
          {copy[step].title}
        </Text>
        <Text variant="body" tone="secondary">
          {copy[step].body}
        </Text>
      </View>

      {step === 'styles' ? (
        <StyleTypographicGrid
          options={DESIGN_STYLES}
          selected={preferredStyles}
          onToggle={(id) => toggle('preferredStyles', id)}
        />
      ) : null}
      {step === 'industries' ? (
        <SelectionCards
          options={INDUSTRIES}
          selected={preferredIndustries}
          onToggle={(id) => toggle('preferredIndustries', id)}
        />
      ) : null}
      {step === 'platforms' ? (
        <PlatformImageTiles
          options={PLATFORMS}
          selected={preferredPlatforms}
          onToggle={(id) => toggle('preferredPlatforms', id)}
        />
      ) : null}
      {step === 'colours' ? (
        <ColourSwatches
          selected={preferredColourFamilies}
          onToggle={(id) => toggle('preferredColourFamilies', id)}
        />
      ) : null}
      {step === 'categories' ? (
        <SelectionCards
          options={CATEGORIES}
          selected={preferredCategories}
          onToggle={(id) => toggle('preferredCategories', id)}
        />
      ) : null}

      <FormError message={error} />

      <View style={styles.footer}>
        {stepIndex > 0 ? (
          <Button label="Back" variant="ghost" onPress={() => setStepIndex((value) => value - 1)} />
        ) : null}
        <Button
          label={stepIndex === STEPS.length - 1 ? 'Continue to profile' : 'Continue'}
          size="lg"
          onPress={onContinue}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
