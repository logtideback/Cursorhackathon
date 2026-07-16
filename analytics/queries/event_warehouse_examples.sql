-- =============================================================================
-- Example event-warehouse queries (PostHog / Amplitude / BigQuery export)
-- =============================================================================
-- These assume a normalised events table:
--   events(event_name text, user_id text, ts timestamptz, properties jsonb)
-- They do NOT run against the Taste application database.
--
-- Operational approximates (DAU/WAU, swipe rates, retention, categories, tags,
-- follows, upload/collection rates) live in operational_product_metrics.sql.
-- =============================================================================

-- Daily active users from app_opened
select
  date_trunc('day', ts) as day,
  count(distinct user_id) as dau
from events
where event_name = 'app_opened'
group by 1;

-- Weekly active users
select
  date_trunc('week', ts) as week,
  count(distinct user_id) as wau
from events
where event_name = 'app_opened'
group by 1;

-- Swipe-right / swipe-left rates
select
  count(*) filter (where event_name = 'design_swiped_right')::numeric
    / nullif(count(*) filter (where event_name in ('design_swiped_left', 'design_swiped_right')), 0)
    as swipe_right_rate,
  count(*) filter (where event_name = 'design_swiped_left')::numeric
    / nullif(count(*) filter (where event_name in ('design_swiped_left', 'design_swiped_right')), 0)
    as swipe_left_rate
from events
where ts >= now() - interval '7 days';

-- Designs viewed per session (session_id optional — falls back to opens)
select
  date_trunc('day', ts) as day,
  count(*) filter (where event_name = 'design_viewed')::numeric
    / nullif(count(*) filter (where event_name = 'app_opened'), 0)
    as designs_viewed_per_session
from events
group by 1;

-- Save-to-collection conversion
select
  count(*) filter (where event_name = 'design_added_to_collection')::numeric
    / nullif(count(*) filter (where event_name = 'design_swiped_right'), 0)
    as save_to_collection_rate
from events
where ts >= now() - interval '7 days';

-- Undo rate
select
  count(*) filter (where event_name = 'swipe_undone')::numeric
    / nullif(
      count(*) filter (
        where event_name in ('design_swiped_left', 'design_swiped_right')
      ),
      0
    ) as undo_rate
from events
where ts >= now() - interval '7 days';

-- Search-to-open conversion (never joins on raw query text)
select
  count(*) filter (where event_name = 'search_result_opened')::numeric
    / nullif(count(*) filter (where event_name = 'search_completed'), 0)
    as search_to_open_rate
from events
where ts >= now() - interval '7 days';

-- Upload completion (published uploads vs started — design_uploaded is completion)
select
  count(*) filter (
    where event_name = 'design_uploaded' and properties->>'status' = 'published'
  )::numeric
    / nullif(count(*) filter (where event_name = 'design_uploaded'), 0)
    as upload_completion_rate
from events
where ts >= now() - interval '30 days';

-- Collection creation rate (events per DAU day)
select
  date_trunc('day', ts) as day,
  count(*) filter (where event_name = 'collection_created') as collections_created,
  count(distinct user_id) filter (where event_name = 'app_opened') as dau,
  count(*) filter (where event_name = 'collection_created')::numeric
    / nullif(count(distinct user_id) filter (where event_name = 'app_opened'), 0)
    as collections_per_dau
from events
group by 1;
