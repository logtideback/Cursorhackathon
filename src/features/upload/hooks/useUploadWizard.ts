import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { CATEGORIES, INDUSTRIES, PLATFORMS } from '@/features/onboarding/constants';
import { UPLOAD_STEPS, type UploadStep } from '@/features/upload/constants';
import {
  clearUploadDraft,
  createEmptyDraft,
  draftHasContent,
  loadUploadDraft,
  saveUploadDraft,
} from '@/features/upload/drafts';
import { applyCenterCrop, preparePickedAsset } from '@/features/upload/images';
import { runPrePublishModeration } from '@/features/upload/moderation';
import type {
  LocalUploadImage,
  SimilarDesignResult,
  UploadDraft,
  UploadImageProgress,
} from '@/features/upload/types';
import {
  isValidHttpUrl,
  parseTagInput,
  reorderItems,
  validateImageCount,
} from '@/features/upload/validation';
import { track } from '@/lib/analytics';
import { emitModerationHook } from '@/lib/content-moderation';
import { isEnvConfigured } from '@/lib/env';
import {
  deleteOwnDesign,
  fetchOwnDesignForEdit,
  insertModerationFlags,
  mockPublishDesign,
  publishOrUpdateDesign,
} from '@/services/design-upload';
import type { DesignProvenance } from '@/types/database';
import { ensureMediaLibraryAccess, ImagePicker } from '@/utils/image-picker';

function stepIndex(step: UploadStep): number {
  return UPLOAD_STEPS.indexOf(step);
}

export function useUploadWizard(options?: {
  userId?: string | null;
  editingDesignId?: string | null;
}) {
  const userId = options?.userId ?? null;
  const editingDesignId = options?.editingDesignId ?? null;

  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [readyBanner, setReadyBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [similarDesigns, setSimilarDesigns] = useState<SimilarDesignResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadImageProgress[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishLocked, setPublishLocked] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moderationRef = useRef<Awaited<ReturnType<typeof runPrePublishModeration>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!userId) {
        setHydrated(true);
        return;
      }

      if (editingDesignId && isEnvConfigured()) {
        try {
          const existing = await fetchOwnDesignForEdit(editingDesignId);
          if (cancelled) {
            return;
          }
          if (existing) {
            setDraft({
              ...createEmptyDraft(userId, editingDesignId),
              step: 'title',
              title: existing.title,
              description: existing.description ?? '',
              categorySlug: existing.categorySlug,
              platform: existing.platform,
              industry: existing.industry,
              tags: existing.tags,
              provenance: existing.provenance,
              sourceUrl: existing.sourceUrl ?? '',
              images: existing.images.map((image, index) => ({
                localId: `existing_${image.id}_${index}`,
                uri: image.imageUrl,
                thumbnailUri: image.thumbnailUrl,
                width: 1200,
                height: 1500,
                mimeType: 'image/jpeg',
                byteSize: 0,
                originalFileName: null,
                cropApplied: false,
              })),
            });
            setHydrated(true);
            return;
          }
        } catch {
          // Fall through to blank/draft.
        }
      }

      const saved = await loadUploadDraft(userId);
      if (cancelled) {
        return;
      }
      if (saved && draftHasContent(saved) && !editingDesignId) {
        setDraft(saved);
        setReadyBanner('Restored your unfinished upload draft.');
      } else {
        setDraft(createEmptyDraft(userId, editingDesignId));
      }
      setHydrated(true);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId, editingDesignId]);

  const persistDraft = useCallback(
    (next: UploadDraft) => {
      setDraft(next);
      if (!userId || editingDesignId) {
        return;
      }
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(() => {
        void saveUploadDraft(next);
      }, 400);
    },
    [userId, editingDesignId],
  );

  const updateDraft = useCallback(
    (patch: Partial<UploadDraft>) => {
      setDraft((current) => {
        if (!current) {
          return current;
        }
        const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
        if (!editingDesignId && userId) {
          if (saveTimer.current) {
            clearTimeout(saveTimer.current);
          }
          saveTimer.current = setTimeout(() => {
            void saveUploadDraft(next);
          }, 400);
        }
        return next;
      });
    },
    [editingDesignId, userId],
  );

  const currentStep = draft?.step ?? 'select';
  const stepNumber = stepIndex(currentStep) + 1;
  const totalSteps = UPLOAD_STEPS.length;

  const canLeaveSafely = useMemo(() => {
    if (!draft) {
      return true;
    }
    return !draftHasContent(draft) || publishing;
  }, [draft, publishing]);

  const goToStep = useCallback(
    (step: UploadStep) => {
      updateDraft({ step });
    },
    [updateDraft],
  );

  const goNext = useCallback(() => {
    if (!draft) {
      return;
    }
    const index = stepIndex(draft.step);
    const next = UPLOAD_STEPS[Math.min(index + 1, UPLOAD_STEPS.length - 1)];
    updateDraft({ step: next });
  }, [draft, updateDraft]);

  const goBack = useCallback(() => {
    if (!draft) {
      return;
    }
    const index = stepIndex(draft.step);
    const prev = UPLOAD_STEPS[Math.max(index - 1, 0)];
    updateDraft({ step: prev });
  }, [draft, updateDraft]);

  const pickImages = useCallback(async () => {
    if (!draft) {
      return;
    }
    const allowed = await ensureMediaLibraryAccess('Allow photo access to upload designs.');
    if (!allowed) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 8,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const countCheck = validateImageCount(draft.images.length, result.assets.length);
    if (!countCheck.ok) {
      setError(countCheck.message);
      return;
    }

    setError(null);
    const prepared: LocalUploadImage[] = [];
    for (const asset of result.assets) {
      const outcome = await preparePickedAsset({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      });
      if (!outcome.ok) {
        setError(outcome.message);
        continue;
      }
      prepared.push(outcome.image);
    }

    if (prepared.length === 0) {
      return;
    }

    updateDraft({
      images: [...draft.images, ...prepared],
      step: 'review',
    });
  }, [draft, updateDraft]);

  const removeImage = useCallback(
    (localId: string) => {
      if (!draft) {
        return;
      }
      updateDraft({
        images: draft.images.filter((image) => image.localId !== localId),
      });
    },
    [draft, updateDraft],
  );

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!draft) {
        return;
      }
      updateDraft({ images: reorderItems(draft.images, fromIndex, toIndex) });
    },
    [draft, updateDraft],
  );

  const cropImageAt = useCallback(
    async (localId: string) => {
      if (!draft) {
        return;
      }
      const image = draft.images.find((item) => item.localId === localId);
      if (!image) {
        return;
      }
      try {
        const cropped = await applyCenterCrop(image);
        updateDraft({
          images: draft.images.map((item) => (item.localId === localId ? cropped : item)),
        });
      } catch {
        setError('Could not crop this image.');
      }
    },
    [draft, updateDraft],
  );

  const setTitle = (title: string) => updateDraft({ title });
  const setDescription = (description: string) => updateDraft({ description });
  const setCategorySlug = (categorySlug: string) => updateDraft({ categorySlug });
  const setPlatform = (platform: string) => updateDraft({ platform });
  const setIndustry = (industry: string) => updateDraft({ industry });
  const setTagsFromInput = (raw: string) => updateDraft({ tags: parseTagInput(raw) });
  const setProvenance = (provenance: DesignProvenance) => updateDraft({ provenance });
  const setSourceUrl = (sourceUrl: string) => updateDraft({ sourceUrl });

  const validateBeforeAdvance = useCallback((): string | null => {
    if (!draft) {
      return 'Upload is not ready.';
    }
    switch (draft.step) {
      case 'select':
      case 'review':
      case 'reorder':
      case 'crop':
        return draft.images.length === 0 ? 'Add at least one image.' : null;
      case 'title':
        return draft.title.trim().length < 2 ? 'Add a title with at least 2 characters.' : null;
      case 'category':
        return draft.categorySlug ? null : 'Choose a category.';
      case 'platform':
        return draft.platform ? null : 'Choose a platform.';
      case 'provenance':
        return draft.provenance ? null : 'Choose a provenance option.';
      case 'source':
        return isValidHttpUrl(draft.sourceUrl) ? null : 'Enter a valid http(s) URL or leave blank.';
      default:
        return null;
    }
  }, [draft]);

  const handleNext = useCallback(async () => {
    const validationError = validateBeforeAdvance();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (!draft) {
      return;
    }

    if (draft.step === 'source') {
      const primary = draft.images[0]?.uri;
      if (primary) {
        try {
          const bundle = await runPrePublishModeration(primary);
          moderationRef.current = bundle;
          setSimilarDesigns(bundle.similar);
        } catch {
          moderationRef.current = null;
          setSimilarDesigns([]);
        }
      }
    }

    goNext();
  }, [draft, goNext, validateBeforeAdvance]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
    setPublishing(false);
    setPublishLocked(false);
  }, []);

  const publish = useCallback(async () => {
    if (!draft || publishLocked || publishing) {
      return;
    }
    if (!draft.provenance) {
      setError('Choose provenance before publishing.');
      return;
    }
    if (draft.images.length === 0) {
      setError('Add at least one image.');
      return;
    }

    setPublishLocked(true);
    setPublishing(true);
    setError(null);
    updateDraft({ step: 'publish' });

    const controller = new AbortController();
    abortRef.current = controller;

    const input = {
      editingDesignId: draft.editingDesignId,
      designId: draft.designId,
      title: draft.title,
      description: draft.description,
      categorySlug: draft.categorySlug,
      platform: draft.platform,
      industry: draft.industry?.trim() ? draft.industry : null,
      tags: draft.tags,
      provenance: draft.provenance,
      sourceUrl: draft.sourceUrl.trim() || null,
      images: draft.images,
      status: 'published' as const,
    };

    try {
      const result = isEnvConfigured()
        ? await publishOrUpdateDesign(input, {
            signal: controller.signal,
            onProgress: setUploadProgress,
          })
        : await mockPublishDesign(input);

      const moderation = moderationRef.current;
      if (moderation && isEnvConfigured()) {
        await insertModerationFlags({
          designId: result.designId,
          safetyFlagged: moderation.safety.flaggedForReview,
          duplicateFlagged: moderation.duplicate.flaggedForReview,
          similarDesignIds: moderation.similar.map((item) => item.designId),
          similarityFlagged: moderation.similar.some((item) => item.score >= 0.75),
          details: {
            safety: moderation.safety,
            duplicate: moderation.duplicate,
          },
        });
        void emitModerationHook({
          event: 'pre_publish_reviewed',
          targetKind: 'design',
          targetId: result.designId,
          metadata: {
            safetyFlagged: moderation.safety.flaggedForReview,
            duplicateFlagged: moderation.duplicate.flaggedForReview,
          },
        });
      }

      if (userId && !draft.editingDesignId) {
        await clearUploadDraft(userId);
      }

      if (draft.editingDesignId) {
        track({
          name: 'design_updated',
          properties: {
            designId: result.designId,
            imageCount: draft.images.length,
            provenance: draft.provenance,
          },
        });
      } else {
        track({
          name: 'design_uploaded',
          properties: {
            designId: result.designId,
            imageCount: draft.images.length,
            provenance: draft.provenance,
            status: 'published',
          },
        });
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publish failed';
      setError(message);
      setPublishLocked(false);
      throw err;
    } finally {
      setPublishing(false);
      abortRef.current = null;
    }
  }, [draft, publishLocked, publishing, updateDraft, userId]);

  const saveAsDraft = useCallback(async () => {
    if (!draft || !userId) {
      return;
    }
    await saveUploadDraft(draft);
    Alert.alert('Draft saved', 'You can leave and continue later from Upload.');
  }, [draft, userId]);

  const discardDraft = useCallback(async () => {
    if (!userId) {
      return;
    }
    await clearUploadDraft(userId);
    setDraft(createEmptyDraft(userId, editingDesignId));
    setSimilarDesigns([]);
    setUploadProgress([]);
    setPublishLocked(false);
    setError(null);
  }, [userId, editingDesignId]);

  const deleteDesign = useCallback(async (designId: string) => {
    if (!isEnvConfigured()) {
      return;
    }
    await deleteOwnDesign(designId);
  }, []);

  return {
    draft,
    hydrated,
    readyBanner,
    clearReadyBanner: () => setReadyBanner(null),
    error,
    setError,
    similarDesigns,
    uploadProgress,
    publishing,
    publishLocked,
    currentStep,
    stepNumber,
    totalSteps,
    categories: CATEGORIES,
    platforms: PLATFORMS,
    industries: INDUSTRIES,
    canLeaveSafely,
    pickImages,
    removeImage,
    moveImage,
    cropImageAt,
    setTitle,
    setDescription,
    setCategorySlug,
    setPlatform,
    setIndustry,
    setTagsFromInput,
    setProvenance,
    setSourceUrl,
    handleNext,
    goBack,
    goToStep,
    publish,
    cancelUpload,
    saveAsDraft,
    discardDraft,
    deleteDesign,
    persistDraft,
  };
}
