import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components';
import { PROVENANCE_LABELS } from '@/features/designs/detail/constants';
import { ColourSwatches } from '@/features/onboarding/components/ColourSwatches';
import { StyleTypographicGrid } from '@/features/onboarding/components/StyleTypographicGrid';
import { CATEGORIES, DESIGN_STYLES, INDUSTRIES, PLATFORMS } from '@/features/onboarding/constants';
import { CheckboxRow, FilterSection, RadioRow } from '@/features/search/components/FilterControls';
import {
  DATE_ADDED_OPTIONS,
  POPULARITY_OPTIONS,
  SAVED_STATUS_OPTIONS,
  SORT_OPTIONS,
} from '@/features/search/constants';
import { useFilterPreviewCount } from '@/features/search/hooks/useSearchResults';
import { useSearchStore } from '@/features/search/store';
import { trackEvent } from '@/lib/analytics/track';
import { colors, spacing } from '@/theme';
import type { DesignProvenance } from '@/types/database';

const PROVENANCE_VALUES = Object.keys(PROVENANCE_LABELS) as DesignProvenance[];

export function SearchFiltersScreen() {
  const draft = useSearchStore((s) => s.draftFilters);
  const setDraftFilters = useSearchStore((s) => s.setDraftFilters);
  const applyDraftFilters = useSearchStore((s) => s.applyDraftFilters);
  const clearAllFilters = useSearchStore((s) => s.clearAllFilters);
  const preview = useFilterPreviewCount();

  const toggleArrayValue = (
    key: 'categories' | 'styles' | 'platforms' | 'industries',
    id: string,
  ) => {
    setDraftFilters((current) => {
      const list = current[key];
      const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
      return { ...current, [key]: next };
    });
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="label" tone="tertiary">
            Filters
          </Text>
          <Text variant="heading">Refine search</Text>
          <Text variant="body" tone="secondary">
            Apply deliberate constraints. Results update when you confirm below.
          </Text>
        </View>

        <FilterSection title="Category">
          {CATEGORIES.map((option) => (
            <CheckboxRow
              key={option.id}
              label={option.label}
              selected={draft.categories.includes(option.id)}
              onPress={() => toggleArrayValue('categories', option.id)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Style" description="Typography-led style tiles.">
          <StyleTypographicGrid
            options={DESIGN_STYLES}
            selected={draft.styles}
            onToggle={(id) => toggleArrayValue('styles', id)}
          />
        </FilterSection>

        <FilterSection title="Platform">
          {PLATFORMS.map((option) => (
            <CheckboxRow
              key={option.id}
              label={option.label}
              selected={draft.platforms.includes(option.id)}
              onPress={() => toggleArrayValue('platforms', option.id)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Industry">
          {INDUSTRIES.map((option) => (
            <CheckboxRow
              key={option.id}
              label={option.label}
              selected={draft.industries.includes(option.id)}
              onPress={() => toggleArrayValue('industries', option.id)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Colour family" description="Use swatches — not pills.">
          <ColourSwatches
            selected={draft.colourFamilies}
            onToggle={(id) =>
              setDraftFilters((current) => ({
                ...current,
                colourFamilies: current.colourFamilies.includes(id)
                  ? current.colourFamilies.filter((item) => item !== id)
                  : [...current.colourFamilies, id],
              }))
            }
          />
        </FilterSection>

        <FilterSection title="Date added">
          {DATE_ADDED_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              label={option.label}
              selected={draft.dateAdded === option.value}
              onPress={() =>
                setDraftFilters((current) => ({ ...current, dateAdded: option.value }))
              }
            />
          ))}
        </FilterSection>

        <FilterSection title="Popularity">
          {POPULARITY_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              label={option.label}
              selected={draft.popularity === option.value}
              onPress={() =>
                setDraftFilters((current) => ({ ...current, popularity: option.value }))
              }
            />
          ))}
        </FilterSection>

        <FilterSection title="Creator">
          {draft.creatorId ? (
            <CheckboxRow
              label={draft.creatorLabel ?? 'Selected creator'}
              selected
              onPress={() =>
                setDraftFilters((current) => ({
                  ...current,
                  creatorId: null,
                  creatorLabel: null,
                }))
              }
            />
          ) : (
            <Text variant="caption" tone="secondary">
              From Creators results, tap Filter on a row to scope design results to that creator.
            </Text>
          )}
        </FilterSection>

        <FilterSection title="Provenance">
          {PROVENANCE_VALUES.map((value) => (
            <CheckboxRow
              key={value}
              label={PROVENANCE_LABELS[value]}
              selected={draft.provenances.includes(value)}
              onPress={() =>
                setDraftFilters((current) => ({
                  ...current,
                  provenances: current.provenances.includes(value)
                    ? current.provenances.filter((item) => item !== value)
                    : [...current.provenances, value],
                }))
              }
            />
          ))}
        </FilterSection>

        <FilterSection title="Saved status">
          {SAVED_STATUS_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              label={option.label}
              selected={draft.savedStatus === option.value}
              onPress={() =>
                setDraftFilters((current) => ({ ...current, savedStatus: option.value }))
              }
            />
          ))}
        </FilterSection>

        <FilterSection title="Sort">
          {SORT_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              label={option.label}
              selected={draft.sort === option.value}
              onPress={() => setDraftFilters((current) => ({ ...current, sort: option.value }))}
            />
          ))}
        </FilterSection>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Clear all"
          variant="ghost"
          onPress={() => {
            clearAllFilters();
            trackEvent('filter_cleared', { key: 'all' });
          }}
        />
        <Button
          label={
            preview.data != null
              ? `Apply · ${preview.data} designs`
              : preview.isFetching
                ? 'Counting…'
                : 'Apply filters'
          }
          loading={preview.isFetching && preview.data == null}
          onPress={() => {
            applyDraftFilters();
            trackEvent('filter_applied', {
              result_count: preview.data ?? null,
            });
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['5xl'],
    gap: spacing.md,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
