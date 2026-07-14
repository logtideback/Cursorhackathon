/**
 * Strongly typed analytics catalogue for Taste.
 * Event names are snake_case and stable across vendors.
 */

export type AnalyticsSurface = 'discover' | 'search' | 'similar' | 'detail' | 'profile' | 'upload';

export type AnalyticsEvent =
  | { name: 'app_opened'; properties: { coldStart: boolean } }
  | { name: 'onboarding_started'; properties: Record<string, never> }
  | {
      name: 'onboarding_step_viewed';
      properties: { step: 'preferences' | 'profile' | string; stepIndex: number };
    }
  | {
      name: 'onboarding_completed';
      properties: {
        categoryCount: number;
        styleCount: number;
        platformCount: number;
        industryCount: number;
      };
    }
  | { name: 'sign_up_completed'; properties: { method: 'email' | 'magic_link' | 'apple' | 'google' } }
  | { name: 'sign_in_completed'; properties: { method: 'email' | 'magic_link' | 'apple' | 'google' } }
  | {
      name: 'design_viewed';
      properties: {
        designId: string;
        creatorId: string;
        source: AnalyticsSurface;
        provenance?: string;
      };
    }
  | {
      name: 'design_swiped_left';
      properties: {
        designId: string;
        creatorId: string;
        categoryId?: string;
        source: 'discover';
      };
    }
  | {
      name: 'design_swiped_right';
      properties: {
        designId: string;
        creatorId: string;
        categoryId?: string;
        source: 'discover';
      };
    }
  | {
      name: 'swipe_undone';
      properties: {
        designId: string;
        previousDirection: 'left' | 'right';
        source: 'discover';
      };
    }
  | {
      name: 'design_saved';
      properties: {
        designId: string;
        collectionId: string;
        hasAspect: boolean;
        hasNote: boolean;
        source: AnalyticsSurface;
      };
    }
  | {
      name: 'design_removed_from_saved';
      properties: { designId: string; collectionId: string; source: AnalyticsSurface };
    }
  | {
      name: 'design_added_to_collection';
      properties: {
        designId: string;
        collectionId: string;
        isDefaultCollection: boolean;
        source: AnalyticsSurface;
      };
    }
  | {
      name: 'design_removed_from_collection';
      properties: { designId: string; collectionId: string; source: AnalyticsSurface };
    }
  | {
      name: 'collection_created';
      properties: { collectionId: string; isPrivate: boolean };
    }
  | {
      name: 'collection_shared';
      properties: { collectionId: string; isPrivate: boolean };
    }
  | {
      name: 'creator_viewed';
      properties: { creatorId: string; isSelf: boolean; source: AnalyticsSurface | 'search' };
    }
  | { name: 'creator_followed'; properties: { creatorId: string; source: AnalyticsSurface } }
  | { name: 'creator_unfollowed'; properties: { creatorId: string; source: AnalyticsSurface } }
  | { name: 'creator_hidden'; properties: { creatorId: string; source: AnalyticsSurface } }
  | { name: 'creator_blocked'; properties: { creatorId: string; source: AnalyticsSurface } }
  | {
      name: 'design_shared';
      properties: { designId: string; creatorId?: string; source: AnalyticsSurface };
    }
  | {
      name: 'source_link_opened';
      properties: { designId: string; hasValidUrl: boolean };
    }
  | {
      name: 'design_uploaded';
      properties: {
        designId: string;
        imageCount: number;
        provenance: string;
        status: 'published' | 'draft';
      };
    }
  | {
      name: 'design_updated';
      properties: { designId: string; imageCount: number; provenance?: string };
    }
  | {
      name: 'search_started';
      properties: {
        /** Length only — never the raw query string. */
        queryLength: number;
        hasQuery: boolean;
        resultType: string;
      };
    }
  | {
      name: 'search_completed';
      properties: {
        queryLength: number;
        hasQuery: boolean;
        resultCount: number;
        resultType: string;
        durationMs?: number;
      };
    }
  | {
      name: 'search_result_opened';
      properties: {
        resultType: 'design' | 'creator' | 'taxonomy';
        resultId: string;
        position?: number;
      };
    }
  | {
      name: 'filter_applied';
      properties: {
        filterKey: string;
        activeFilterCount: number;
        action: 'apply' | 'clear' | 'clear_all';
      };
    }
  | {
      name: 'show_less_selected';
      properties: {
        designId: string;
        creatorId?: string;
        targetCount: number;
        targets: string;
      };
    }
  | {
      name: 'report_submitted';
      properties: {
        targetType: 'design' | 'creator';
        targetId: string;
        reason: string;
      };
    }
  | {
      name: 'recommendation_explanation_viewed';
      properties: {
        designId: string;
        reasonCount: number;
        primaryReason?: string;
      };
    }
  | {
      name: 'analytics_consent_updated';
      properties: { granted: boolean; source: 'settings' | 'prompt' };
    };

export type AnalyticsEventName = AnalyticsEvent['name'];

export type AnalyticsTraits = {
  role?: string;
  onboardingCompleted?: boolean;
  /** Never include email, name, or other PII here unless explicitly consented. */
};
