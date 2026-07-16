import { z } from 'zod';

import { COLLECTION_DESCRIPTION_MAX, COLLECTION_NAME_MAX } from '@/features/collections/constants';

export const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a collection name.')
    .max(COLLECTION_NAME_MAX, `Name must be ${COLLECTION_NAME_MAX} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(
      COLLECTION_DESCRIPTION_MAX,
      `Description must be ${COLLECTION_DESCRIPTION_MAX} characters or fewer.`,
    )
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean(),
  coverImageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

export type CreateCollectionValues = z.infer<typeof createCollectionSchema>;

export function isDuplicateNameError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('collections_user_lower_name_uidx') ||
    message.includes('duplicate key') ||
    message.includes('already exists')
  );
}
