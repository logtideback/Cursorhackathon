export const CREATOR_PROFILE_QUERY_KEY = 'creator-profile' as const;

export const PROVENANCE_EXPLANATIONS = {
  original_work: {
    label: 'Original work',
    body: 'You designed this yourself for your own practice or portfolio.',
  },
  client_work: {
    label: 'Client work',
    body: 'Commissioned work created for a client or employer. Credit remains yours.',
  },
  concept: {
    label: 'Concept',
    body: 'Speculative or concept exploration that was never shipped as a live product.',
  },
  redesign: {
    label: 'Redesign',
    body: 'A reimagining of an existing product or brand. Credit the original where relevant.',
  },
  ai_assisted: {
    label: 'AI-assisted',
    body: 'You directed the work; generative tools helped with parts of the craft.',
  },
  fully_ai_generated: {
    label: 'Fully AI-generated',
    body: 'The imagery was produced primarily by generative tools with light human curation.',
  },
} as const;
