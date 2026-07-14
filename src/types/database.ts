export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'user' | 'creator' | 'admin';

export type DesignProvenance =
  'original_work' | 'client_work' | 'concept' | 'redesign' | 'ai_assisted' | 'fully_ai_generated';

export type DesignStatus = 'draft' | 'published' | 'archived' | 'removed';

export type SwipeDirection = 'left' | 'right';

export type SavedAspect =
  | 'typography'
  | 'layout'
  | 'navigation'
  | 'motion'
  | 'colour'
  | 'branding'
  | 'interaction'
  | 'other';

export type ReportReason = 'spam' | 'inappropriate' | 'copyright' | 'misleading' | 'other';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type FeedbackType = 'show_less' | 'hide_creator' | 'hide_tag' | 'hide_style';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website_url: string | null;
          role: UserRole;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website_url?: string | null;
          role?: UserRole;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website_url?: string | null;
          role?: UserRole;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_categories: string[];
          preferred_styles: string[];
          preferred_platforms: string[];
          preferred_industries: string[];
          preferred_colour_families: string[];
          disliked_categories: string[];
          disliked_styles: string[];
          disliked_tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_categories?: string[];
          preferred_styles?: string[];
          preferred_platforms?: string[];
          preferred_industries?: string[];
          preferred_colour_families?: string[];
          disliked_categories?: string[];
          disliked_styles?: string[];
          disliked_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_categories?: string[];
          preferred_styles?: string[];
          preferred_platforms?: string[];
          preferred_industries?: string[];
          preferred_colour_families?: string[];
          disliked_categories?: string[];
          disliked_styles?: string[];
          disliked_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      designs: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          category_id: string | null;
          source_url: string | null;
          platform: string | null;
          industry: string | null;
          provenance: DesignProvenance;
          status: DesignStatus;
          is_featured: boolean;
          save_count: number;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          category_id?: string | null;
          source_url?: string | null;
          platform?: string | null;
          industry?: string | null;
          provenance?: DesignProvenance;
          status?: DesignStatus;
          is_featured?: boolean;
          save_count?: number;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          category_id?: string | null;
          source_url?: string | null;
          platform?: string | null;
          industry?: string | null;
          provenance?: DesignProvenance;
          status?: DesignStatus;
          is_featured?: boolean;
          save_count?: number;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'designs_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'designs_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      design_images: {
        Row: {
          id: string;
          design_id: string;
          image_url: string;
          thumbnail_url: string | null;
          width: number | null;
          height: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          design_id: string;
          image_url: string;
          thumbnail_url?: string | null;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          design_id?: string;
          image_url?: string;
          thumbnail_url?: string | null;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'design_images_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'designs';
            referencedColumns: ['id'];
          },
        ];
      };
      design_tags: {
        Row: {
          design_id: string;
          tag_id: string;
        };
        Insert: {
          design_id: string;
          tag_id: string;
        };
        Update: {
          design_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'design_tags_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'designs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'design_tags_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
      swipes: {
        Row: {
          id: string;
          user_id: string;
          design_id: string;
          direction: SwipeDirection;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          design_id: string;
          direction: SwipeDirection;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          design_id?: string;
          direction?: SwipeDirection;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'swipes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'swipes_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'designs';
            referencedColumns: ['id'];
          },
        ];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_image_url: string | null;
          is_private: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_private?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_private?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collections_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          design_id: string;
          note: string | null;
          saved_aspect: SavedAspect | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          design_id: string;
          note?: string | null;
          saved_aspect?: SavedAspect | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          design_id?: string;
          note?: string | null;
          saved_aspect?: SavedAspect | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_items_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_items_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'designs';
            referencedColumns: ['id'];
          },
        ];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_following_id_fkey';
            columns: ['following_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          design_id: string;
          reason: ReportReason;
          notes: string | null;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          design_id: string;
          reason: ReportReason;
          notes?: string | null;
          status?: ReportStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          design_id?: string;
          reason?: ReportReason;
          notes?: string | null;
          status?: ReportStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'designs';
            referencedColumns: ['id'];
          },
        ];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      design_feedback: {
        Row: {
          id: string;
          user_id: string;
          design_id: string;
          feedback_type: FeedbackType;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          design_id: string;
          feedback_type: FeedbackType;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          design_id?: string;
          feedback_type?: FeedbackType;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'design_feedback_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'design_feedback_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'designs';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_unseen_designs: {
        Args: { p_limit?: number };
        Returns: UnseenDesignRow[];
      };
      get_recommended_designs: {
        Args: { p_limit?: number; p_exclude_ids?: string[] };
        Returns: Json;
      };
      record_swipe: {
        Args: { p_design_id: string; p_direction: SwipeDirection };
        Returns: Json;
      };
      undo_last_swipe: {
        Args: Record<string, never>;
        Returns: Json;
      };
      increment_design_view_count: {
        Args: { p_design_id: string };
        Returns: number;
      };
      adjust_design_save_count: {
        Args: { p_design_id: string; p_delta: number };
        Returns: number;
      };
      add_design_to_collection: {
        Args: {
          p_collection_id: string;
          p_design_id: string;
          p_note?: string | null;
          p_saved_aspect?: SavedAspect | null;
        };
        Returns: Database['public']['Tables']['collection_items']['Row'];
      };
      remove_design_from_collection: {
        Args: { p_collection_id: string; p_design_id: string };
        Returns: boolean;
      };
      add_right_swipe_to_default_collection: {
        Args: { p_user_id: string; p_design_id: string };
        Returns: string | null;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      design_provenance: DesignProvenance;
      design_status: DesignStatus;
      swipe_direction: SwipeDirection;
      saved_aspect: SavedAspect;
      report_reason: ReportReason;
      report_status: ReportStatus;
      feedback_type: FeedbackType;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type UnseenDesignRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  source_url: string | null;
  platform: string | null;
  industry: string | null;
  provenance: DesignProvenance;
  status: DesignStatus;
  is_featured: boolean;
  save_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
  primary_image_url: string | null;
  primary_thumbnail_url: string | null;
  tags: string[];
};

export type RecordSwipeResult = {
  swipe_id: string;
  design_id: string;
  direction: SwipeDirection;
  created_at: string;
  collection_item_id: string | null;
  save_count: number;
};

export type UndoSwipeResult = {
  undone_swipe_id: string;
  direction: SwipeDirection;
  removed_from_default_collection: boolean;
  save_count: number;
  design: {
    id: string;
    creator_id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    source_url: string | null;
    platform: string | null;
    industry: string | null;
    provenance: DesignProvenance;
    status: DesignStatus;
    is_featured: boolean;
    save_count: number;
    view_count: number;
    created_at: string;
    updated_at: string;
    primary_image_url: string | null;
    primary_thumbnail_url: string | null;
  } | null;
};
