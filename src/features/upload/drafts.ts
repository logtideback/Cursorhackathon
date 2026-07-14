import AsyncStorage from '@react-native-async-storage/async-storage';

import { UPLOAD_DRAFT_STORAGE_KEY, UPLOAD_STEPS } from '@/features/upload/constants';
import type { UploadDraft } from '@/features/upload/types';

function draftKey(userId: string): string {
  return `${UPLOAD_DRAFT_STORAGE_KEY}:${userId}`;
}

function isUploadStep(value: unknown): value is UploadDraft['step'] {
  return typeof value === 'string' && (UPLOAD_STEPS as readonly string[]).includes(value);
}

export function createEmptyDraft(userId: string, editingDesignId?: string | null): UploadDraft {
  return {
    version: 1,
    draftId: `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    designId: null,
    editingDesignId: editingDesignId ?? null,
    step: 'select',
    images: [],
    title: '',
    description: '',
    categorySlug: null,
    platform: null,
    industry: null,
    tags: [],
    provenance: null,
    sourceUrl: '',
    updatedAt: new Date().toISOString(),
  };
}

export async function loadUploadDraft(userId: string): Promise<UploadDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(draftKey(userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as UploadDraft;
    if (parsed?.version !== 1 || parsed.userId !== userId || !isUploadStep(parsed.step)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveUploadDraft(draft: UploadDraft): Promise<void> {
  const payload: UploadDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(draftKey(draft.userId), JSON.stringify(payload));
}

export async function clearUploadDraft(userId: string): Promise<void> {
  await AsyncStorage.removeItem(draftKey(userId));
}

export function draftHasContent(draft: UploadDraft): boolean {
  return (
    draft.images.length > 0 ||
    Boolean(draft.title.trim()) ||
    Boolean(draft.description.trim()) ||
    Boolean(draft.categorySlug) ||
    Boolean(draft.platform) ||
    Boolean(draft.industry) ||
    draft.tags.length > 0 ||
    Boolean(draft.provenance) ||
    Boolean(draft.sourceUrl.trim())
  );
}
