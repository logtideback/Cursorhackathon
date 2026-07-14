import { DesignFeedbackActionsSheet } from '@/features/preferences';

import type { SearchDesignHit } from '@/features/search/types';

type DesignQuickActionsSheetProps = {
  visible: boolean;
  item: SearchDesignHit | null;
  onClose: () => void;
  onRemovedFromResults?: (designId: string) => void;
};

/** Search long-press sheet — delegates to shared preference feedback actions. */
export function DesignQuickActionsSheet({
  visible,
  item,
  onClose,
  onRemovedFromResults,
}: DesignQuickActionsSheetProps) {
  return (
    <DesignFeedbackActionsSheet
      visible={visible}
      design={
        item
          ? {
              designId: item.id,
              title: item.title,
              creatorId: item.creatorId,
              creatorName: item.creatorName,
              categorySlug: item.categorySlug,
              tags: item.tags,
              styleSlugs: item.tags,
              colourFamilies: [],
              provenance: item.provenance,
            }
          : null
      }
      onClose={onClose}
      onRemoved={onRemovedFromResults}
    />
  );
}
