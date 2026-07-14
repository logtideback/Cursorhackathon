export const animation = {
  duration: {
    instant: 100,
    fast: 160,
    normal: 240,
    slow: 360,
    deliberate: 480,
  },
  /** Swipe card settle / dismiss timings. */
  swipe: {
    snap: 220,
    dismiss: 280,
  },
} as const;

export type AnimationDuration = keyof typeof animation.duration;
