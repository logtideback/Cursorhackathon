import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { fetchDefaultCollection } from '@/services/collections';
import { updateProfile } from '@/services/profiles';
import type { Tables, TablesUpdate } from '@/types/database';

export type PreferenceSelections = {
  preferredCategories: string[];
  preferredStyles: string[];
  preferredPlatforms: string[];
  preferredIndustries: string[];
  preferredColourFamilies: string[];
};

export async function upsertPreferences(
  selections: PreferenceSelections,
): Promise<Tables<'user_preferences'>> {
  assertEnvConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw userError;
  }
  if (!user) {
    throw new Error('Not authenticated');
  }

  const payload: TablesUpdate<'user_preferences'> = {
    preferred_categories: selections.preferredCategories,
    preferred_styles: selections.preferredStyles,
    preferred_platforms: selections.preferredPlatforms,
    preferred_industries: selections.preferredIndustries,
    preferred_colour_families: selections.preferredColourFamilies,
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...payload }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export type CompleteOnboardingInput = PreferenceSelections & {
  username: string;
  displayName: string;
  bio?: string;
  websiteUrl?: string;
  avatarUrl?: string | null;
};

export async function completeOnboarding(input: CompleteOnboardingInput) {
  assertEnvConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw userError;
  }
  if (!user) {
    throw new Error('Not authenticated');
  }

  await upsertPreferences(input);

  const profile = await updateProfile({
    username: input.username.trim().toLowerCase(),
    display_name: input.displayName.trim(),
    bio: input.bio?.trim() || null,
    website_url: input.websiteUrl?.trim() || null,
    avatar_url: input.avatarUrl ?? null,
    onboarding_completed: true,
  });

  let collection = await fetchDefaultCollection(user.id);
  if (!collection) {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: 'Saved',
        description: 'Designs you swipe right on.',
        is_private: true,
        is_default: true,
      })
      .select('*')
      .single();
    if (error) {
      throw error;
    }
    collection = data;
  }

  return { profile, collection };
}
