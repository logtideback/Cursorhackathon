import type { SavedAspect, Tables } from '@/types/database';

import { resolveCoverSources } from '@/features/collections/cover';
import type {
  ChooseCollectionOption,
  CollectionDesignItem,
  CollectionDetail,
  CollectionSummary,
  CreateCollectionInput,
  PublicCollectionPayload,
  UpdateCollectionInput,
} from '@/features/collections/types';
import { getMockDiscoverCards } from '@/features/discover/data/mock-designs';

type MockItem = {
  id: string;
  collectionId: string;
  designId: string;
  note: string | null;
  savedAspect: SavedAspect | null;
  sortOrder: number;
  createdAt: string;
};

const now = () => new Date().toISOString();

let mockCollections: Tables<'collections'>[] = [
  {
    id: 'mock-col-saved',
    user_id: 'mock-user',
    name: 'Saved',
    description: 'Designs you swipe right on.',
    cover_image_url: null,
    is_private: true,
    is_default: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'mock-col-type',
    user_id: 'mock-user',
    name: 'Typography studies',
    description: 'Quiet type specimens and editorial grids.',
    cover_image_url: null,
    is_private: false,
    is_default: false,
    created_at: now(),
    updated_at: now(),
  },
];

let mockItems: MockItem[] = getMockDiscoverCards(8).map((card, index) => ({
  id: `mock-item-${card.id}`,
  collectionId: index < 5 ? 'mock-col-saved' : 'mock-col-type',
  designId: card.id,
  note: index === 0 ? 'Love the data density.' : null,
  savedAspect: index === 0 ? 'layout' : index === 2 ? 'typography' : null,
  sortOrder: index < 5 ? index : index - 5,
  createdAt: now(),
}));

function touchCollection(collectionId: string) {
  mockCollections = mockCollections.map((collection) =>
    collection.id === collectionId ? { ...collection, updated_at: now() } : collection,
  );
}

function designMeta(designId: string) {
  const card = getMockDiscoverCards(20).find((item) => item.id === designId);
  if (!card) {
    return {
      title: null,
      imageUrl: null,
      thumbnailUrl: null,
      unavailable: true,
    };
  }
  return {
    title: card.title,
    imageUrl: card.imageUrl,
    thumbnailUrl: card.thumbnailUrl,
    unavailable: false,
  };
}

export function getMockCollectionSummaries(): CollectionSummary[] {
  const sorted = [...mockCollections].sort((a, b) => {
    if (a.is_default !== b.is_default) {
      return a.is_default ? -1 : 1;
    }
    return b.updated_at.localeCompare(a.updated_at);
  });

  return sorted.map((collection) => {
    const items = mockItems
      .filter((item) => item.collectionId === collection.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const mosaicUrls = resolveCoverSources({
      customCoverUrl: collection.cover_image_url,
      itemImageUrls: items.map((item) => designMeta(item.designId).imageUrl),
    });
    return {
      ...collection,
      designCount: items.length,
      mosaicUrls,
    };
  });
}

export function getMockCollectionDetail(collectionId: string): CollectionDetail | null {
  const collection = mockCollections.find((item) => item.id === collectionId);
  if (!collection) {
    return null;
  }
  const items: CollectionDesignItem[] = mockItems
    .filter((item) => item.collectionId === collectionId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => {
      const meta = designMeta(item.designId);
      return {
        itemId: item.id,
        designId: item.designId,
        note: item.note,
        savedAspect: item.savedAspect,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt,
        title: meta.title,
        imageUrl: meta.imageUrl,
        thumbnailUrl: meta.thumbnailUrl,
        unavailable: meta.unavailable,
      };
    });
  return { collection, items, isOwner: true };
}

export function mockCreateCollection(input: CreateCollectionInput): Tables<'collections'> {
  const duplicate = mockCollections.some(
    (collection) => collection.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
  );
  if (duplicate) {
    throw new Error('A collection with this name already exists');
  }
  const collection: Tables<'collections'> = {
    id: `mock-col-${Date.now()}`,
    user_id: 'mock-user',
    name: input.name.trim(),
    description: input.description?.trim() || null,
    cover_image_url: input.coverImageUrl ?? null,
    is_private: input.isPrivate,
    is_default: false,
    created_at: now(),
    updated_at: now(),
  };
  mockCollections = [...mockCollections, collection];
  return collection;
}

export function mockUpdateCollection(
  collectionId: string,
  input: UpdateCollectionInput,
): Tables<'collections'> {
  const current = mockCollections.find((item) => item.id === collectionId);
  if (!current) {
    throw new Error('Collection not found');
  }
  if (input.name) {
    const duplicate = mockCollections.some(
      (collection) =>
        collection.id !== collectionId &&
        collection.name.trim().toLowerCase() === input.name!.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new Error('A collection with this name already exists');
    }
  }
  const next: Tables<'collections'> = {
    ...current,
    name: input.name?.trim() ?? current.name,
    description:
      input.description !== undefined ? input.description?.trim() || null : current.description,
    is_private: input.isPrivate ?? current.is_private,
    cover_image_url:
      input.coverImageUrl !== undefined ? input.coverImageUrl : current.cover_image_url,
    updated_at: now(),
  };
  mockCollections = mockCollections.map((item) => (item.id === collectionId ? next : item));
  return next;
}

export function mockDeleteCollection(collectionId: string): void {
  const current = mockCollections.find((item) => item.id === collectionId);
  if (!current || current.is_default) {
    throw new Error('Cannot delete this collection');
  }
  mockCollections = mockCollections.filter((item) => item.id !== collectionId);
  mockItems = mockItems.filter((item) => item.collectionId !== collectionId);
}

export function mockAddDesign(params: {
  collectionId: string;
  designId: string;
  note?: string | null;
  savedAspect?: SavedAspect | null;
}): MockItem {
  const existing = mockItems.find(
    (item) => item.collectionId === params.collectionId && item.designId === params.designId,
  );
  if (existing) {
    const updated = {
      ...existing,
      note: params.note ?? existing.note,
      savedAspect: params.savedAspect ?? existing.savedAspect,
    };
    mockItems = mockItems.map((item) => (item.id === existing.id ? updated : item));
    touchCollection(params.collectionId);
    return updated;
  }
  const maxOrder = mockItems
    .filter((item) => item.collectionId === params.collectionId)
    .reduce((max, item) => Math.max(max, item.sortOrder), -1);
  const created: MockItem = {
    id: `mock-item-${params.designId}-${params.collectionId}`,
    collectionId: params.collectionId,
    designId: params.designId,
    note: params.note ?? null,
    savedAspect: params.savedAspect ?? null,
    sortOrder: maxOrder + 1,
    createdAt: now(),
  };
  mockItems = [...mockItems, created];
  touchCollection(params.collectionId);
  return created;
}

export function mockRemoveDesign(collectionId: string, designId: string): boolean {
  const before = mockItems.length;
  mockItems = mockItems.filter(
    (item) => !(item.collectionId === collectionId && item.designId === designId),
  );
  touchCollection(collectionId);
  return mockItems.length < before;
}

export function mockReorder(collectionId: string, orderedItemIds: string[]): void {
  const order = new Map(orderedItemIds.map((id, index) => [id, index]));
  mockItems = mockItems.map((item) => {
    if (item.collectionId !== collectionId || !order.has(item.id)) {
      return item;
    }
    return { ...item, sortOrder: order.get(item.id)! };
  });
  touchCollection(collectionId);
}

export function mockMoveDesign(params: {
  fromCollectionId: string;
  toCollectionId: string;
  designId: string;
}): void {
  const source = mockItems.find(
    (item) => item.collectionId === params.fromCollectionId && item.designId === params.designId,
  );
  if (!source) {
    throw new Error('Design is not in the source collection');
  }
  mockRemoveDesign(params.fromCollectionId, params.designId);
  mockAddDesign({
    collectionId: params.toCollectionId,
    designId: params.designId,
    note: source.note,
    savedAspect: source.savedAspect,
  });
}

export function mockChooserOptions(designId: string): ChooseCollectionOption[] {
  return getMockCollectionSummaries().map((collection) => ({
    id: collection.id,
    name: collection.name,
    isDefault: collection.is_default,
    isPrivate: collection.is_private,
    containsDesign: mockItems.some(
      (item) => item.collectionId === collection.id && item.designId === designId,
    ),
    updatedAt: collection.updated_at,
    mosaicUrls: collection.mosaicUrls,
  }));
}

export function getMockPublicCollection(collectionId: string): PublicCollectionPayload | null {
  const detail = getMockCollectionDetail(collectionId);
  if (!detail || detail.collection.is_private) {
    return null;
  }
  return {
    id: detail.collection.id,
    name: detail.collection.name,
    description: detail.collection.description,
    cover_image_url: detail.collection.cover_image_url,
    is_private: detail.collection.is_private,
    is_default: detail.collection.is_default,
    created_at: detail.collection.created_at,
    updated_at: detail.collection.updated_at,
    items: detail.items.map((item) => ({
      id: item.itemId,
      design_id: item.designId,
      note: item.note,
      saved_aspect: item.savedAspect,
      sort_order: item.sortOrder,
      created_at: item.createdAt,
      design_title: item.title,
      design_status: item.unavailable ? 'removed' : 'published',
      image_url: item.imageUrl,
      thumbnail_url: item.thumbnailUrl,
    })),
  };
}
