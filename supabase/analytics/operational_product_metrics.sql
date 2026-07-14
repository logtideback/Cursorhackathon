-- =============================================================================
-- Taste product-metric queries (OPERATIONAL data, not vendor event warehouse)
-- =============================================================================
-- These queries run against the Supabase application database (profiles, swipes,
-- collections, etc.). They are intentionally SEPARATE from mobile analytics
-- events shipped to PostHog / Amplitude.
--
-- Do NOT store raw analytics event streams in these tables.
-- Use vendor warehouses (or a dedicated analytics schema) for event ETL.
-- =============================================================================

-- Daily active users (users with any swipe or save activity that UTC day)
-- Params: :day date
create or replace view public.analytics_ops_daily_active_users as
select
  timezone('utc', s.created_at)::date as activity_day,
  count(distinct s.user_id) as dau
from public.swipes s
group by 1;

-- Weekly active users (rolling 7-day distinct swipers per week start)
create or replace view public.analytics_ops_weekly_active_users as
select
  date_trunc('week', timezone('utc', s.created_at))::date as week_start,
  count(distinct s.user_id) as wau
from public.swipes s
group by 1;

-- Swipe-right / swipe-left rates
create or replace view public.analytics_ops_swipe_rates as
select
  timezone('utc', created_at)::date as activity_day,
  count(*) filter (where direction = 'right')::numeric
    / nullif(count(*), 0) as swipe_right_rate,
  count(*) filter (where direction = 'left')::numeric
    / nullif(count(*), 0) as swipe_left_rate,
  count(*) as swipe_count
from public.swipes
group by 1;

-- Designs viewed proxy: save_count increments + swipe volume are operational;
-- true design_viewed rates live in the event warehouse. This view approximates
-- "engagements per day" from swipes.
create or replace view public.analytics_ops_engagements_per_day as
select
  timezone('utc', created_at)::date as activity_day,
  count(*) as engagements,
  count(distinct user_id) as users,
  count(*)::numeric / nullif(count(distinct user_id), 0) as engagements_per_user
from public.swipes
group by 1;

-- Save-to-collection conversion (right swipe that also landed in a collection)
create or replace view public.analytics_ops_save_conversion as
select
  timezone('utc', s.created_at)::date as activity_day,
  count(*) filter (where s.direction = 'right') as right_swipes,
  count(distinct ci.id) as collection_saves,
  count(distinct ci.id)::numeric
    / nullif(count(*) filter (where s.direction = 'right'), 0) as save_to_collection_rate
from public.swipes s
left join public.collection_items ci
  on ci.design_id = s.design_id
 and exists (
   select 1 from public.collections c
   where c.id = ci.collection_id and c.user_id = s.user_id
 )
 and ci.created_at between s.created_at and s.created_at + interval '2 minutes'
group by 1;

-- Undo rate cannot be measured from retained swipe rows alone (undos delete).
-- Prefer event warehouse: swipe_undone / (design_swiped_left + design_swiped_right).

-- Day-1 / Day-7 / Day-30 retention cohorts (sign-up via profiles.created_at)
create or replace view public.analytics_ops_retention_cohorts as
with cohorts as (
  select
    id as user_id,
    timezone('utc', created_at)::date as cohort_day
  from public.profiles
),
activity as (
  select distinct
    user_id,
    timezone('utc', created_at)::date as activity_day
  from public.swipes
)
select
  c.cohort_day,
  count(distinct c.user_id) as cohort_size,
  count(distinct c.user_id) filter (
    where exists (
      select 1 from activity a
      where a.user_id = c.user_id and a.activity_day = c.cohort_day + 1
    )
  )::numeric / nullif(count(distinct c.user_id), 0) as day1_retention,
  count(distinct c.user_id) filter (
    where exists (
      select 1 from activity a
      where a.user_id = c.user_id and a.activity_day = c.cohort_day + 7
    )
  )::numeric / nullif(count(distinct c.user_id), 0) as day7_retention,
  count(distinct c.user_id) filter (
    where exists (
      select 1 from activity a
      where a.user_id = c.user_id and a.activity_day = c.cohort_day + 30
    )
  )::numeric / nullif(count(distinct c.user_id), 0) as day30_retention
from cohorts c
group by 1;

-- Most-saved categories
create or replace view public.analytics_ops_most_saved_categories as
select
  coalesce(cat.slug, 'uncategorised') as category_slug,
  coalesce(cat.name, 'Uncategorised') as category_name,
  count(*) as save_count
from public.collection_items ci
join public.designs d on d.id = ci.design_id
left join public.categories cat on cat.id = d.category_id
group by 1, 2
order by save_count desc;

-- Most-dismissed tags (left swipes)
create or replace view public.analytics_ops_most_dismissed_tags as
select
  lower(t.slug) as tag_slug,
  t.name as tag_name,
  count(*) as dismiss_count
from public.swipes s
join public.design_tags dt on dt.design_id = s.design_id
join public.tags t on t.id = dt.tag_id
where s.direction = 'left'
group by 1, 2
order by dismiss_count desc;

-- Most-followed creators
create or replace view public.analytics_ops_most_followed_creators as
select
  p.id as creator_id,
  p.username,
  p.display_name,
  count(*) as follower_count
from public.follows f
join public.profiles p on p.id = f.following_id
group by 1, 2, 3
order by follower_count desc;

-- Upload completion rate requires design status transitions in app DB
create or replace view public.analytics_ops_upload_completion as
select
  timezone('utc', created_at)::date as activity_day,
  count(*) filter (where status = 'published') as published,
  count(*) filter (where status = 'draft') as drafts,
  count(*) filter (where status = 'published')::numeric
    / nullif(count(*) filter (where status in ('published', 'draft', 'removed')), 0)
    as upload_completion_rate
from public.designs
group by 1;

-- Collection creation rate (collections created per active user day)
create or replace view public.analytics_ops_collection_creation as
select
  timezone('utc', c.created_at)::date as activity_day,
  count(*) filter (where c.is_default = false) as collections_created,
  count(distinct c.user_id) as creators,
  count(*) filter (where c.is_default = false)::numeric
    / nullif(count(distinct c.user_id), 0) as collections_per_creator
from public.collections c
group by 1;

comment on view public.analytics_ops_daily_active_users is
  'Operational product metric — not a substitute for vendor analytics events.';
