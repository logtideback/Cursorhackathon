import type {
  ControlledCreator,
  PreferenceControls,
  ShowLessHistoryItem,
  ShowMeLessPayload,
  TasteFacet,
  TasteProfileSummary,
  TasteShift,
} from '@/features/preferences/types';
import { assertEnvConfigured, isEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ExplorationLevel, Tables } from '@/types/database';

function throwOnError(error: { message: string } | null, fallback: string): void {
  if (error) {
    throw new Error(error.message || fallback);
  }
}

function mapCreator(row: Record<string, unknown>, atKey: string): ControlledCreator {
  return {
    id: String(row.id),
    username: (row.username as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    at: String(row[atKey] ?? ''),
  };
}

function mapFacet(row: Record<string, unknown>): TasteFacet {
  return {
    key: String(row.key ?? ''),
    label: String(row.label ?? row.key ?? ''),
    count: Number(row.count ?? 0),
  };
}

export async function fetchCurrentPreferences(): Promise<Tables<'user_preferences'> | null> {
  assertEnvConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  throwOnError(userError, 'Failed to resolve user');
  if (!user) {
    return null;
  }
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  throwOnError(error, 'Failed to load preferences');
  return data;
}

export async function updateRecommendationSettings(input: {
  includeAiAssisted?: boolean;
  includeFullyAiGenerated?: boolean;
  explorationLevel?: ExplorationLevel;
}): Promise<Tables<'user_preferences'>> {
  assertEnvConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  throwOnError(userError, 'Failed to resolve user');
  if (!user) {
    throw new Error('Not authenticated');
  }

  const payload = {
    user_id: user.id,
    ...(input.includeAiAssisted !== undefined
      ? { include_ai_assisted: input.includeAiAssisted }
      : {}),
    ...(input.includeFullyAiGenerated !== undefined
      ? { include_fully_ai_generated: input.includeFullyAiGenerated }
      : {}),
    ...(input.explorationLevel !== undefined ? { exploration_level: input.explorationLevel } : {}),
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  throwOnError(error, 'Failed to update recommendation settings');
  if (!data) {
    throw new Error('Failed to update recommendation settings');
  }
  return data;
}

export async function applyShowLessFeedback(payload: ShowMeLessPayload): Promise<void> {
  assertEnvConfigured();
  const { error } = await supabase.rpc('apply_show_less_feedback', {
    p_design_id: payload.designId,
    p_targets: payload.targets,
    p_style_slugs: payload.styleSlugs ?? [],
    p_colour_families: payload.colourFamilies ?? [],
    p_layout_patterns: payload.layoutPatterns ?? [],
    p_category_slug: payload.categorySlug ?? null,
    p_tags: payload.tags ?? [],
    p_creator_id: payload.creatorId ?? null,
  });
  throwOnError(error, 'Failed to save feedback');
}

export async function hideCreator(creatorId: string): Promise<void> {
  assertEnvConfigured();
  const { error } = await supabase.rpc('hide_creator', { p_creator_id: creatorId });
  throwOnError(error, 'Failed to hide creator');
}

export async function unhideCreator(creatorId: string): Promise<void> {
  assertEnvConfigured();
  const { error } = await supabase.rpc('unhide_creator', { p_creator_id: creatorId });
  throwOnError(error, 'Failed to unhide creator');
}

export async function resetHiddenPreferences(): Promise<void> {
  assertEnvConfigured();
  const { error } = await supabase.rpc('reset_hidden_preferences');
  throwOnError(error, 'Failed to reset hidden preferences');
}

export async function resetRecommendationHistory(): Promise<void> {
  assertEnvConfigured();
  const { error } = await supabase.rpc('reset_recommendation_history');
  throwOnError(error, 'Failed to reset recommendation history');
}

export async function fetchPreferenceControls(): Promise<PreferenceControls> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('list_preference_controls');
  throwOnError(error, 'Failed to load preference controls');
  const row = (data ?? {}) as Record<string, unknown>;
  const prefs = (row.preferences as Record<string, unknown> | null) ?? null;
  const hidden = Array.isArray(row.hidden_creators) ? row.hidden_creators : [];
  const blocked = Array.isArray(row.blocked_creators) ? row.blocked_creators : [];
  const history = Array.isArray(row.show_less_history) ? row.show_less_history : [];

  return {
    includeAiAssisted: prefs ? Boolean(prefs.include_ai_assisted ?? true) : true,
    includeFullyAiGenerated: prefs ? Boolean(prefs.include_fully_ai_generated ?? true) : true,
    explorationLevel: (prefs?.exploration_level as ExplorationLevel) ?? 'balanced',
    dislikedCategories: (prefs?.disliked_categories as string[]) ?? [],
    dislikedStyles: (prefs?.disliked_styles as string[]) ?? [],
    dislikedTags: (prefs?.disliked_tags as string[]) ?? [],
    dislikedColourFamilies: (prefs?.disliked_colour_families as string[]) ?? [],
    dislikedLayoutPatterns: (prefs?.disliked_layout_patterns as string[]) ?? [],
    hiddenCreators: hidden.map((item) => mapCreator(item as Record<string, unknown>, 'hidden_at')),
    blockedCreators: blocked.map((item) =>
      mapCreator(item as Record<string, unknown>, 'blocked_at'),
    ),
    showLessHistory: history.map((item) => {
      const entry = item as Record<string, unknown>;
      return {
        id: String(entry.id),
        designId: String(entry.design_id),
        title: String(entry.title ?? 'Design'),
        feedbackType: String(entry.feedback_type),
        metadata: (entry.metadata as Record<string, unknown>) ?? {},
        createdAt: String(entry.created_at ?? ''),
      } satisfies ShowLessHistoryItem;
    }),
  };
}

export async function fetchTasteProfileSummary(): Promise<TasteProfileSummary> {
  if (!isEnvConfigured()) {
    return getMockTasteProfile();
  }
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('get_taste_profile_summary');
  throwOnError(error, 'Failed to load taste profile');
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    styles: (Array.isArray(row.styles) ? row.styles : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    categories: (Array.isArray(row.categories) ? row.categories : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    colourFamilies: (Array.isArray(row.colour_families) ? row.colour_families : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    tags: (Array.isArray(row.tags) ? row.tags : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    platforms: (Array.isArray(row.platforms) ? row.platforms : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    industries: (Array.isArray(row.industries) ? row.industries : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    creators: (Array.isArray(row.creators) ? row.creators : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    recentStyles: (Array.isArray(row.recent_styles) ? row.recent_styles : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    priorStyles: (Array.isArray(row.prior_styles) ? row.prior_styles : []).map((item) =>
      mapFacet(item as Record<string, unknown>),
    ),
    shifts: (Array.isArray(row.shifts) ? row.shifts : []).map((item) => {
      const shift = item as Record<string, unknown>;
      return {
        key: String(shift.key ?? ''),
        label: String(shift.label ?? shift.key ?? ''),
        direction: (shift.direction as 'rising' | 'cooling') ?? 'rising',
        recentCount: Number(shift.recent_count ?? 0),
        priorCount: Number(shift.prior_count ?? 0),
      } satisfies TasteShift;
    }),
    generatedAt: String(row.generated_at ?? new Date().toISOString()),
    source: 'remote',
  };
}

export function getMockTasteProfile(): TasteProfileSummary {
  return {
    styles: [
      { key: 'editorial', label: 'editorial', count: 18 },
      { key: 'typography', label: 'typography', count: 14 },
      { key: 'minimal', label: 'minimal', count: 9 },
    ],
    categories: [
      { key: 'marketing-site', label: 'Marketing site', count: 12 },
      { key: 'mobile-app', label: 'Mobile app', count: 8 },
    ],
    colourFamilies: [
      { key: 'warm-neutrals', label: 'warm-neutrals', count: 11 },
      { key: 'ink-black', label: 'ink-black', count: 7 },
    ],
    tags: [
      { key: 'type', label: 'Type', count: 10 },
      { key: 'empty-state', label: 'Empty state', count: 6 },
    ],
    platforms: [
      { key: 'responsive-web', label: 'Responsive web', count: 13 },
      { key: 'ios', label: 'iOS', count: 5 },
    ],
    industries: [
      { key: 'saas', label: 'SaaS', count: 9 },
      { key: 'media', label: 'Media', count: 4 },
    ],
    creators: [
      { key: 'studio-north', label: 'Studio North', count: 5 },
      { key: 'mira-chen', label: 'Mira Chen', count: 3 },
    ],
    recentStyles: [
      { key: 'editorial', label: 'editorial', count: 6 },
      { key: 'organic', label: 'organic', count: 4 },
    ],
    priorStyles: [
      { key: 'editorial', label: 'editorial', count: 4 },
      { key: 'swiss', label: 'swiss', count: 5 },
    ],
    shifts: [
      {
        key: 'organic',
        label: 'organic',
        direction: 'rising',
        recentCount: 4,
        priorCount: 1,
      },
    ],
    generatedAt: new Date().toISOString(),
    source: 'mock',
  };
}

export function getMockPreferenceControls(): PreferenceControls {
  return {
    includeAiAssisted: true,
    includeFullyAiGenerated: false,
    explorationLevel: 'balanced',
    dislikedCategories: [],
    dislikedStyles: ['brutalist'],
    dislikedTags: ['neon'],
    dislikedColourFamilies: [],
    dislikedLayoutPatterns: [],
    hiddenCreators: [],
    blockedCreators: [],
    showLessHistory: [],
  };
}
