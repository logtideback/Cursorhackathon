# Taste analytics

## 1. Architecture

```
App UI / hooks
    │  track(AnalyticsEvent) | screen() | identify() | reset()
    ▼
AnalyticsClient  ── consent gate ── sanitize ── validate(__DEV__)
    │
    ├─ ConsoleAnalyticsProvider   (always in __DEV__)
    ├─ PostHogAnalyticsProvider   (if EXPO_PUBLIC_POSTHOG_KEY)
    └─ AmplitudeAnalyticsProvider (if EXPO_PUBLIC_AMPLITUDE_API_KEY)
```

- **Operational data** lives in Supabase (swipes, collections, profiles).  
- **Analytics events** are vendor-independent and never write into app tables.  
- Product metric SQL under `analytics/queries/` reads operational tables for funnel approximation; warehouse SQL examples cover true event metrics (undo rate, search-to-open).

## 2. Event catalogue

See `src/lib/analytics/events.ts` for the typed `AnalyticsEvent` union. Names:

| Event | Purpose |
| --- | --- |
| `app_opened` | Cold/warm open |
| `onboarding_started` / `_step_viewed` / `_completed` | Onboarding funnel |
| `sign_up_completed` / `sign_in_completed` | Auth success (no credentials) |
| `design_viewed` | Detail open |
| `design_swiped_left` / `_right` | Discover gestures |
| `swipe_undone` | Undo |
| `design_saved` / `_removed_from_saved` | Save actions |
| `design_added_to_collection` / `_removed_from_collection` | Collection membership |
| `collection_created` / `collection_shared` | Collections |
| `creator_viewed` / `_followed` / `_unfollowed` / `_hidden` / `_blocked` | Social |
| `design_shared` / `source_link_opened` | Sharing |
| `design_uploaded` / `design_updated` | Creator publish |
| `search_started` / `_completed` / `search_result_opened` | Search (query length only) |
| `filter_applied` | Filters |
| `show_less_selected` | Preference feedback |
| `report_submitted` | Moderation |
| `recommendation_explanation_viewed` | Explanation UI |
| `analytics_consent_updated` | Consent change |

## 3. Privacy considerations

- Never log passwords, tokens, private collection notes, email, or raw search query text.
- Search events expose `queryLength` + `hasQuery` only.
- Consent required by default (`requireConsent: true`); Settings → Allow analytics.
- Identity `reset()` on sign-out.
- Analytics can be disabled entirely via consent store / `analytics.setEnabled(false)`.
- Screen views are deduplicated within 1.5s.
- `__DEV__` validation drops malformed payloads with a console warning.

## 4. Example product-metric queries

Apply (or copy) views from:

- `analytics/queries/operational_product_metrics.sql` — DAU/WAU, swipe rates, retention cohorts, most-saved categories, dismissed tags, followed creators, upload/collection rates.
- `analytics/queries/event_warehouse_examples.sql` — undo rate, search-to-open, designs/session once events land in a warehouse.

## 5. Connecting PostHog or Amplitude later

1. Set `EXPO_PUBLIC_POSTHOG_KEY` (+ optional `EXPO_PUBLIC_POSTHOG_HOST`) and/or `EXPO_PUBLIC_AMPLITUDE_API_KEY` in `.env` / EAS secrets.
2. Install the vendor SDK (`posthog-react-native` or `@amplitude/analytics-react-native`).
3. Replace the TODO bodies in:
   - `src/lib/analytics/adapters/posthog.ts`
   - `src/lib/analytics/adapters/amplitude.ts`
4. Keep sanitization + consent gates; do not bypass `AnalyticsClient`.
5. Map event names 1:1 — do not rename in the adapter.
6. Verify consent-denied users emit nothing; verify sign-out calls `reset()`.
