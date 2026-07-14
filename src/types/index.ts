export type DesignId = string;
export type CreatorId = string;
export type CollectionId = string;

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type DesignCard = {
  id: DesignId;
  title: string;
  imageUrl: string;
  creatorId: CreatorId;
  creatorName: string;
  tags: string[];
};

export type {
  Database,
  DesignProvenance,
  DesignStatus,
  FeedbackType,
  Json,
  RecordSwipeResult,
  ReportReason,
  ReportStatus,
  SavedAspect,
  SwipeDirection,
  Tables,
  TablesInsert,
  TablesUpdate,
  UndoSwipeResult,
  UnseenDesignRow,
  UserRole,
} from './database';
