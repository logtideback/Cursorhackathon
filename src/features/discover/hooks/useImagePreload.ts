import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';

import { PRELOAD_AHEAD } from '@/features/discover/constants';
import type { DiscoverCard } from '@/features/discover/types';

/**
 * Prefetches the next N card images via Expo Image (disk/memory cache).
 * Skips ids already requested in this session to avoid thrashing.
 */
export function useImagePreload(cards: DiscoverCard[], ahead = PRELOAD_AHEAD) {
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    const targets = cards.slice(0, ahead);
    const urls = targets
      .map((card) => card.imageUrl)
      .filter((url) => Boolean(url) && !prefetched.current.has(url));

    if (urls.length === 0) {
      return;
    }

    urls.forEach((url) => prefetched.current.add(url));

    void Image.prefetch(urls).catch(() => {
      urls.forEach((url) => prefetched.current.delete(url));
    });
  }, [cards, ahead]);
}
