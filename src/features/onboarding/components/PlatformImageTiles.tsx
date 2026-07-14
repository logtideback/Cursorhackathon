import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { PreferenceOption } from '@/features/onboarding/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, fontFamilies, radii, spacing } from '@/theme';

type Props = {
  options: PreferenceOption[];
  selected: string[];
  onToggle: (id: string) => void;
};

const TILE_TONES = ['#EFEBE6', '#E4DFD8', '#D8E2DB', '#E8E4DC', '#DDD8D0', '#E2E8E4'];

/** Abstract image-like tiles for platforms — no stock illustrations. */
export function PlatformImageTiles({ options, selected, onToggle }: Props) {
  const { haptic } = useHaptics();

  return (
    <View style={styles.grid}>
      {options.map((option, index) => {
        const isSelected = selected.includes(option.id);
        return (
          <PressableScale
            key={option.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${option.label} platform`}
            onPress={() => {
              haptic('selection');
              onToggle(option.id);
            }}
            style={[styles.tile, isSelected && styles.tileSelected]}
          >
            <View
              style={[
                styles.canvas,
                { backgroundColor: TILE_TONES[index % TILE_TONES.length] },
                isSelected && styles.canvasSelected,
              ]}
            >
              <View style={[styles.block, isSelected && styles.blockSelected]} />
              <Text style={[styles.glyph, isSelected && styles.glyphSelected]}>
                {option.label.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text variant="caption" tone={isSelected ? 'accent' : 'secondary'} style={styles.label}>
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: '47%',
    gap: spacing.sm,
  },
  tileSelected: {},
  canvas: {
    aspectRatio: 4 / 3,
    borderRadius: radii.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  canvasSelected: {
    borderColor: colors.accent,
  },
  block: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 8,
    backgroundColor: colors.text,
    opacity: 0.12,
  },
  blockSelected: {
    backgroundColor: colors.accent,
    opacity: 0.35,
  },
  glyph: {
    fontFamily: fontFamilies.displaySemibold,
    fontSize: 28,
    color: colors.text,
  },
  glyphSelected: {
    color: colors.accent,
  },
  label: {
    textTransform: 'none',
    letterSpacing: 0,
  },
});
