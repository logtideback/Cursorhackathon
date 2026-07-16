import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CONSUMER_PERSONAS,
  CREATOR_PERSONAS,
  DESIGN_BLUEPRINTS,
  TASTE_PRESETS,
  type DesignBlueprint,
} from './catalog';
import { buildPlaceholderSvg, remotePlaceholderUrl } from './placeholders';
import { createPrng, type Prng } from './prng';
import { SEED_BATCH, SEED_PASSWORD, type SeedSizeConfig } from './sizes';
import { CATEGORY_DEFS, TAG_DEFS } from './taxonomy';

type SeedUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  kind: 'creator' | 'consumer';
  popularity?: 0 | 1 | 2;
  personaIndex: number;
};

type SeedDesign = {
  id: string;
  creatorId: string;
  blueprint: DesignBlueprint;
  status: 'published' | 'draft';
  saveCount: number;
  viewCount: number;
  imageCount: number;
};

function seedEmail(username: string): string {
  return `${username}@taste.local`;
}

async function upsertTaxonomy(client: SupabaseClient): Promise<{
  categories: Map<string, string>;
  tags: Map<string, string>;
}> {
  const { error: catError } = await client.from('categories').upsert(
    CATEGORY_DEFS.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description,
    })),
    { onConflict: 'slug' },
  );
  if (catError) {
    throw new Error(`Category upsert failed: ${catError.message}`);
  }

  const { error: tagError } = await client.from('tags').upsert(
    TAG_DEFS.map((item) => ({ name: item.name, slug: item.slug })),
    { onConflict: 'slug' },
  );
  if (tagError) {
    throw new Error(`Tag upsert failed: ${tagError.message}`);
  }

  const { data: cats, error: catsReadError } = await client
    .from('categories')
    .select('id, slug')
    .in(
      'slug',
      CATEGORY_DEFS.map((c) => c.slug),
    );
  if (catsReadError || !cats) {
    throw new Error(`Reading categories failed: ${catsReadError?.message}`);
  }

  const { data: tags, error: tagsReadError } = await client
    .from('tags')
    .select('id, slug')
    .in(
      'slug',
      TAG_DEFS.map((t) => t.slug),
    );
  if (tagsReadError || !tags) {
    throw new Error(`Reading tags failed: ${tagsReadError?.message}`);
  }

  return {
    categories: new Map(cats.map((row) => [row.slug as string, row.id as string])),
    tags: new Map(tags.map((row) => [row.slug as string, row.id as string])),
  };
}

async function ensureUser(
  client: SupabaseClient,
  params: {
    email: string;
    password: string;
    displayName: string;
    username: string;
    kind: 'creator' | 'consumer';
  },
): Promise<string> {
  const created = await client.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    app_metadata: {
      seed: true,
      seed_batch: SEED_BATCH,
      seed_kind: params.kind,
    },
    user_metadata: {
      display_name: params.displayName,
      seed: true,
    },
  });

  if (!created.error && created.data.user) {
    return created.data.user.id;
  }

  // Already exists — look up by email across pages.
  let page = 1;
  for (;;) {
    const listed = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (listed.error) {
      throw new Error(
        `createUser failed (${created.error?.message}) and listUsers failed (${listed.error.message})`,
      );
    }
    const match = listed.data.users.find((user) => user.email === params.email);
    if (match) {
      return match.id;
    }
    if ((listed.data.users?.length ?? 0) < 200) {
      break;
    }
    page += 1;
  }

  throw new Error(
    `Could not create or find seed user ${params.email}: ${created.error?.message ?? 'unknown'}`,
  );
}

async function uploadPlaceholder(params: {
  client: SupabaseClient;
  path: string;
  svg: string;
  useRemoteFallback: boolean;
  seedKey: string;
  width: number;
  height: number;
}): Promise<string> {
  if (params.useRemoteFallback) {
    return remotePlaceholderUrl(params.seedKey, params.width, params.height);
  }

  const bytes = Buffer.from(params.svg, 'utf8');
  const { error } = await params.client.storage.from('design-images').upload(params.path, bytes, {
    contentType: 'image/svg+xml',
    upsert: true,
  });

  if (error) {
    console.warn(
      `Storage upload failed for ${params.path}: ${error.message} — using remote fallback`,
    );
    return remotePlaceholderUrl(params.seedKey, params.width, params.height);
  }

  const { data } = params.client.storage.from('design-images').getPublicUrl(params.path);
  return data.publicUrl;
}

function allocateDesigns(
  size: SeedSizeConfig,
  creators: SeedUser[],
  prng: Prng,
): { creatorId: string; blueprint: DesignBlueprint; status: 'published' | 'draft' }[] {
  const blueprints = DESIGN_BLUEPRINTS.slice(0, size.designs);
  const weights = creators.map((creator) => {
    if (creator.username === 'drew_pelt') {
      return 0.15; // edge: almost all designs elsewhere; only ~1 published later
    }
    const popularity = creator.popularity ?? 0;
    return popularity === 2 ? 3.2 : popularity === 1 ? 1.6 : 0.8;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);

  const allocations: {
    creatorId: string;
    blueprint: DesignBlueprint;
    status: 'published' | 'draft';
  }[] = [];

  // Edge case: creator with exactly one design.
  const singleCreator =
    creators.find((c) => c.username === 'drew_pelt') ?? creators[creators.length - 1]!;
  allocations.push({
    creatorId: singleCreator.id,
    blueprint: blueprints[0]!,
    status: 'published',
  });

  for (let i = 1; i < blueprints.length; i += 1) {
    let cursor = prng.next() * total;
    let creator = creators[0]!;
    for (let c = 0; c < creators.length; c += 1) {
      cursor -= weights[c]!;
      if (cursor <= 0) {
        creator = creators[c]!;
        break;
      }
    }
    if (
      creator.id === singleCreator.id &&
      allocations.filter((a) => a.creatorId === singleCreator.id).length >= 1
    ) {
      creator = prng.pick(creators.filter((item) => item.id !== singleCreator.id));
    }

    const status: 'published' | 'draft' =
      prng.next() < size.draftRate && i > Math.floor(size.designs * 0.85) ? 'draft' : 'published';

    allocations.push({
      creatorId: creator.id,
      blueprint: blueprints[i]!,
      status,
    });
  }

  // Edge: one creator with zero published (gil_torren keeps only drafts if present).
  const draftOnly = creators.find((c) => c.username === 'gil_torren');
  if (draftOnly) {
    for (const row of allocations) {
      if (row.creatorId === draftOnly.id) {
        row.status = 'draft';
      }
    }
    // Guarantee at least one draft for them.
    if (!allocations.some((row) => row.creatorId === draftOnly.id)) {
      allocations[allocations.length - 1] = {
        creatorId: draftOnly.id,
        blueprint: blueprints[blueprints.length - 1]!,
        status: 'draft',
      };
    }
  }

  return allocations;
}

export async function runSeed(params: {
  client: SupabaseClient;
  size: SeedSizeConfig;
  useRemotePlaceholders?: boolean;
}): Promise<void> {
  const prng = createPrng(`taste-seed-${params.size.name}-${SEED_BATCH}`);
  const useRemote = Boolean(params.useRemotePlaceholders);

  console.log(`Upserting taxonomy…`);
  const { categories, tags } = await upsertTaxonomy(params.client);

  console.log(`Creating ${params.size.creators} creators + ${params.size.consumers} consumers…`);
  const creators: SeedUser[] = [];
  for (let i = 0; i < params.size.creators; i += 1) {
    const persona = CREATOR_PERSONAS[i]!;
    const email = seedEmail(persona.username);
    const id = await ensureUser(params.client, {
      email,
      password: SEED_PASSWORD,
      displayName: persona.displayName,
      username: persona.username,
      kind: 'creator',
    });
    creators.push({
      id,
      email,
      username: persona.username,
      displayName: persona.displayName,
      kind: 'creator',
      popularity: persona.popularity,
      personaIndex: i,
    });
  }

  const consumers: SeedUser[] = [];
  for (let i = 0; i < params.size.consumers; i += 1) {
    const persona = CONSUMER_PERSONAS[i]!;
    const email = seedEmail(persona.username);
    const id = await ensureUser(params.client, {
      email,
      password: SEED_PASSWORD,
      displayName: persona.displayName,
      username: persona.username,
      kind: 'consumer',
    });
    consumers.push({
      id,
      email,
      username: persona.username,
      displayName: persona.displayName,
      kind: 'consumer',
      personaIndex: i,
    });
  }

  console.log('Updating profiles, roles, and recommendation preferences…');
  for (const creator of creators) {
    const persona = CREATOR_PERSONAS[creator.personaIndex]!;
    const { error } = await params.client
      .from('profiles')
      .update({
        username: persona.username,
        display_name: persona.displayName,
        bio: persona.bio,
        website_url: `https://example.com/${persona.websitePath}`,
        role: 'creator',
        onboarding_completed: true,
        account_status: persona.username === 'cass_ydro' ? 'active' : 'active',
        avatar_url: null,
      })
      .eq('id', creator.id);
    if (error) {
      throw new Error(`Profile update failed for ${persona.username}: ${error.message}`);
    }

    const { error: prefError } = await params.client
      .from('user_preferences')
      .update({
        preferred_categories: persona.homeCategories,
        preferred_styles: persona.homeStyles,
        preferred_platforms: persona.homePlatforms,
        preferred_industries: persona.homeIndustries,
        preferred_colour_families: prng.sample(
          [
            'warm-neutrals',
            'cool-greys',
            'ink-black',
            'forest',
            'ochre',
            'terracotta',
            'slate-blue',
            'soft-pink',
          ],
          prng.int(2, 4),
        ),
        exploration_level:
          persona.popularity === 2
            ? 'balanced'
            : persona.popularity === 0
              ? 'adventurous'
              : 'focused',
        include_ai_assisted: true,
        include_fully_ai_generated: persona.popularity !== 2,
      })
      .eq('user_id', creator.id);
    if (prefError) {
      throw new Error(`Creator prefs failed for ${persona.username}: ${prefError.message}`);
    }
  }

  // One suspended creator edge case (not popular).
  const suspendTarget = creators.find((c) => c.username === 'nate_wick');
  if (suspendTarget) {
    await params.client
      .from('profiles')
      .update({ account_status: 'suspended' })
      .eq('id', suspendTarget.id);
  }

  for (const consumer of consumers) {
    const persona = CONSUMER_PERSONAS[consumer.personaIndex]!;
    const preset = TASTE_PRESETS[persona.taste];
    const { error } = await params.client
      .from('profiles')
      .update({
        username: persona.username,
        display_name: persona.displayName,
        bio: persona.bio,
        role: 'user',
        onboarding_completed: true,
        account_status: 'active',
      })
      .eq('id', consumer.id);
    if (error) {
      throw new Error(`Consumer profile failed for ${persona.username}: ${error.message}`);
    }

    const { error: prefError } = await params.client
      .from('user_preferences')
      .update({
        preferred_categories: preset.preferred_categories,
        preferred_styles: preset.preferred_styles,
        preferred_platforms: preset.preferred_platforms,
        preferred_industries: preset.preferred_industries,
        preferred_colour_families: preset.preferred_colour_families,
        disliked_styles: preset.disliked_styles,
        disliked_tags: preset.disliked_tags,
        exploration_level: preset.exploration_level,
        include_ai_assisted: preset.include_ai_assisted,
        include_fully_ai_generated: preset.include_fully_ai_generated,
      })
      .eq('user_id', consumer.id);
    if (prefError) {
      throw new Error(`Consumer prefs failed for ${persona.username}: ${prefError.message}`);
    }
  }

  console.log(`Creating ${params.size.designs} designs with images…`);
  const allocations = allocateDesigns(params.size, creators, prng);
  const seededDesigns: SeedDesign[] = [];

  for (let index = 0; index < allocations.length; index += 1) {
    const allocation = allocations[index]!;
    const blueprint = allocation.blueprint;
    const categoryId = categories.get(blueprint.categorySlug) ?? null;
    const imageCount = prng.int(2, 5);
    const popularityBoost =
      creators.find((c) => c.id === allocation.creatorId)?.popularity === 2 ? 1.8 : 1;
    const viewCount =
      allocation.status === 'published' ? Math.floor(prng.int(12, 420) * popularityBoost) : 0;
    const saveCount =
      allocation.status === 'published' ? Math.floor(prng.int(0, 96) * popularityBoost) : 0;

    const { data: design, error } = await params.client
      .from('designs')
      .insert({
        creator_id: allocation.creatorId,
        title: blueprint.title,
        description: blueprint.description,
        category_id: categoryId,
        platform: blueprint.platform,
        industry: blueprint.industry,
        provenance: blueprint.provenance,
        status: allocation.status,
        is_featured: allocation.status === 'published' && prng.next() < 0.08,
        save_count: saveCount,
        view_count: viewCount,
        source_url: prng.bool(0.55)
          ? `https://example.com/work/${blueprint.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .slice(0, 48)}`
          : null,
        style_slugs: blueprint.styleSlugs,
        colour_families: blueprint.colourFamilies,
      })
      .select('id')
      .single();

    if (error || !design) {
      throw new Error(`Design insert failed (${blueprint.title}): ${error?.message}`);
    }

    const designId = design.id as string;
    seededDesigns.push({
      id: designId,
      creatorId: allocation.creatorId,
      blueprint,
      status: allocation.status,
      saveCount,
      viewCount,
      imageCount,
    });

    for (let imageIndex = 0; imageIndex < imageCount; imageIndex += 1) {
      const seedKey = `${designId}-${imageIndex}`;
      const { svg, width, height } = buildPlaceholderSvg({
        title: blueprint.title,
        subtitle: `${blueprint.categorySlug} · ${blueprint.platform}`,
        seedKey,
        prng,
        width: 800 - imageIndex * 12,
        height: 1000 - imageIndex * 16,
      });
      const path = `${allocation.creatorId}/${designId}/${imageIndex + 1}.svg`;
      const url = await uploadPlaceholder({
        client: params.client,
        path,
        svg,
        useRemoteFallback: useRemote,
        seedKey,
        width,
        height,
      });

      const { error: imageError } = await params.client.from('design_images').insert({
        design_id: designId,
        image_url: url,
        thumbnail_url: url,
        width,
        height,
        sort_order: imageIndex,
      });
      if (imageError) {
        throw new Error(`Image insert failed: ${imageError.message}`);
      }
    }

    const tagIds = blueprint.tagSlugs
      .map((slug) => tags.get(slug))
      .filter((id): id is string => Boolean(id));
    if (tagIds.length > 0) {
      const { error: tagError } = await params.client
        .from('design_tags')
        .insert(tagIds.map((tagId) => ({ design_id: designId, tag_id: tagId })));
      if (tagError && !tagError.message.includes('duplicate')) {
        throw new Error(`design_tags insert failed: ${tagError.message}`);
      }
    }

    if ((index + 1) % 25 === 0) {
      console.log(`  … ${index + 1}/${allocations.length} designs`);
    }
  }

  const published = seededDesigns.filter((d) => d.status === 'published');
  console.log(`Seeding follows, collections, swipes, saves, and feedback…`);

  // Follow graph — popular creators get more followers; relationships stay uneven.
  for (const consumer of [...consumers, ...creators]) {
    const followCount =
      consumer.kind === 'consumer' ? prng.int(3, Math.min(10, creators.length)) : prng.int(1, 5);
    const candidates = prng
      .shuffle(creators.filter((c) => c.id !== consumer.id))
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const chosen = candidates.slice(0, followCount);
    // Bias: always include at least one popular creator when available.
    const popular = creators.filter((c) => c.popularity === 2 && c.id !== consumer.id);
    if (popular.length && !chosen.some((c) => c.popularity === 2)) {
      chosen[0] = prng.pick(popular);
    }
    for (const target of chosen) {
      await params.client.from('follows').upsert({
        follower_id: consumer.id,
        following_id: target.id,
      });
    }
  }

  // Public + private collections.
  const publicNeeded = params.size.publicCollections;
  const privateNeeded = params.size.privateExtraCollections;
  let publicMade = 0;
  let privateMade = 0;
  const owners = prng.shuffle([...creators, ...consumers]);

  for (const owner of owners) {
    if (publicMade >= publicNeeded && privateMade >= privateNeeded) {
      break;
    }
    const makePublic =
      publicMade < publicNeeded && (privateMade >= privateNeeded || prng.bool(0.55));
    const isPrivate = !makePublic;
    if (isPrivate && privateMade >= privateNeeded) {
      continue;
    }
    if (!isPrivate && publicMade >= publicNeeded) {
      continue;
    }

    const name = isPrivate
      ? prng.pick([
          'Desk studies',
          'Night references',
          'Quiet scrapbook',
          'Type drawer',
          'Hold for later',
        ])
      : prng.pick([
          'Interfaces I still study',
          'Travel calendars',
          'Commerce atmospheres',
          'Clinic calm',
          'Swiss scraps',
          'Soft wellness',
          'Festival marks',
          'Ferry weather UI',
          'Ledger clarity',
          'Portfolio frames',
        ]);

    const { data: collection, error } = await params.client
      .from('collections')
      .insert({
        user_id: owner.id,
        name: `${name} ${publicMade + privateMade + 1}`,
        description: isPrivate
          ? 'Private working set for local critique.'
          : 'A public board of finished screens worth revisiting.',
        is_private: isPrivate,
        is_default: false,
      })
      .select('id')
      .single();

    if (error || !collection) {
      // Name collision — skip.
      continue;
    }

    if (isPrivate) {
      privateMade += 1;
    } else {
      publicMade += 1;
    }

    // Edge: some collections intentionally empty.
    if (prng.bool(0.12)) {
      continue;
    }

    const itemCount = prng.int(2, 8);
    const picks = prng.sample(published, itemCount);
    for (let order = 0; order < picks.length; order += 1) {
      const design = picks[order]!;
      await params.client.from('collection_items').upsert(
        {
          collection_id: collection.id,
          design_id: design.id,
          sort_order: order,
          note: prng.bool(0.2) ? 'Revisit the caption hierarchy.' : null,
          saved_aspect: prng.bool(0.35)
            ? prng.pick([
                'layout',
                'typography',
                'colour',
                'navigation',
                'motion',
                'branding',
                'interaction',
                'other',
              ])
            : null,
        },
        { onConflict: 'collection_id,design_id' },
      );
    }
  }

  // Force one empty public collection edge case.
  if (publicMade < publicNeeded) {
    const owner = consumers[0] ?? creators[0]!;
    await params.client.from('collections').insert({
      user_id: owner.id,
      name: 'Empty public moodboard',
      description: 'Intentionally empty — used to test empty collection UI.',
      is_private: false,
      is_default: false,
    });
  }

  // Swipes + default saves for consumers (taste-biased).
  for (const consumer of consumers) {
    const persona = CONSUMER_PERSONAS[consumer.personaIndex]!;
    const preset = TASTE_PRESETS[persona.taste];
    const ranked = [...published].sort((a, b) => {
      const score = (design: SeedDesign) => {
        let value = 0;
        if (preset.preferred_categories.includes(design.blueprint.categorySlug)) value += 3;
        if (design.blueprint.styleSlugs.some((s) => preset.preferred_styles.includes(s)))
          value += 2;
        if (design.blueprint.styleSlugs.some((s) => preset.disliked_styles.includes(s))) value -= 3;
        return value + design.viewCount / 1000;
      };
      return score(b) - score(a);
    });

    const swipeTarget = Math.min(params.size.swipesPerConsumer, ranked.length);
    for (let i = 0; i < swipeTarget; i += 1) {
      const design = ranked[i]!;
      const aligned =
        preset.preferred_categories.includes(design.blueprint.categorySlug) ||
        design.blueprint.styleSlugs.some((s) => preset.preferred_styles.includes(s));
      const disliked = design.blueprint.styleSlugs.some((s) => preset.disliked_styles.includes(s));
      const direction = disliked
        ? 'left'
        : aligned
          ? prng.bool(0.82)
            ? 'right'
            : 'left'
          : prng.bool(0.45)
            ? 'right'
            : 'left';

      await params.client.from('swipes').upsert(
        {
          user_id: consumer.id,
          design_id: design.id,
          direction,
        },
        { onConflict: 'user_id,design_id' },
      );

      if (direction === 'right') {
        const { data: defaultCollection } = await params.client
          .from('collections')
          .select('id')
          .eq('user_id', consumer.id)
          .eq('is_default', true)
          .maybeSingle();
        if (defaultCollection?.id) {
          await params.client.from('collection_items').upsert(
            {
              collection_id: defaultCollection.id,
              design_id: design.id,
              sort_order: i,
            },
            { onConflict: 'collection_id,design_id' },
          );
        }
      }
    }
  }

  // Show-less + hidden creators for a couple of consumers.
  for (const consumer of consumers.slice(0, Math.min(4, consumers.length))) {
    const design = prng.pick(published);
    await params.client.from('design_feedback').insert({
      user_id: consumer.id,
      design_id: design.id,
      feedback_type: 'show_less',
      metadata: {
        targets: ['style', 'category'],
        style_slugs: design.blueprint.styleSlugs.slice(0, 1),
        category_slug: design.blueprint.categorySlug,
        tags: design.blueprint.tagSlugs.slice(0, 2),
        creator_id: design.creatorId,
      },
    });

    if (prng.bool(0.6)) {
      const hide = prng.pick(creators.filter((c) => c.popularity !== 2));
      await params.client.from('hidden_creators').upsert({
        hider_id: consumer.id,
        hidden_id: hide.id,
      });
      await params.client.from('design_feedback').insert({
        user_id: consumer.id,
        design_id: design.id,
        feedback_type: 'hide_creator',
        metadata: { creator_id: hide.id },
      });
    }
  }

  console.log('Seed summary');
  console.log(
    JSON.stringify(
      {
        size: params.size.name,
        creators: creators.length,
        consumers: consumers.length,
        designs: seededDesigns.length,
        published: published.length,
        drafts: seededDesigns.length - published.length,
        publicCollectionsTarget: params.size.publicCollections,
        password: SEED_PASSWORD,
      },
      null,
      2,
    ),
  );
}
