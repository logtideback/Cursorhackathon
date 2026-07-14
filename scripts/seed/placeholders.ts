import type { Prng } from './prng';

/** Editorial palette for deterministic SVG placeholders (no stock photos). */
const PALETTE = [
  { bg: '#F6F4F1', fg: '#3E5C4A', accent: '#D0C9C0' },
  { bg: '#EFEBE6', fg: '#121212', accent: '#8A6A2F' },
  { bg: '#1C1B18', fg: '#F3F0EA', accent: '#8FAF97' },
  { bg: '#D8E2DB', fg: '#2F4638', accent: '#F6F4F1' },
  { bg: '#E8DFD4', fg: '#4A5C6A', accent: '#A66A55' },
  { bg: '#D5D8DC', fg: '#1A1A1A', accent: '#C2923C' },
  { bg: '#F3F0EA', fg: '#8B3A32', accent: '#3E5C4A' },
  { bg: '#24221E', fg: '#A8A39B', accent: '#C4A35A' },
] as const;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildPlaceholderSvg(params: {
  title: string;
  subtitle: string;
  seedKey: string;
  width?: number;
  height?: number;
  prng: Prng;
}): { svg: string; width: number; height: number; contentType: 'image/svg+xml' } {
  const width = params.width ?? 800;
  const height = params.height ?? 1000;
  const palette = params.prng.pick(PALETTE);
  const bandY = Math.floor(height * (0.58 + params.prng.next() * 0.12));
  const title = escapeXml(params.title.slice(0, 42));
  const subtitle = escapeXml(params.subtitle.slice(0, 48));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${palette.bg}"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="${palette.accent}" stroke-width="2"/>
  <rect x="0" y="${bandY}" width="${width}" height="${height - bandY}" fill="${palette.accent}" opacity="0.35"/>
  <text x="72" y="${bandY - 72}" fill="${palette.fg}" font-family="Georgia, 'Times New Roman', serif" font-size="36">${title}</text>
  <text x="72" y="${bandY - 28}" fill="${palette.fg}" font-family="Helvetica, Arial, sans-serif" font-size="18" opacity="0.75">${subtitle}</text>
  <text x="72" y="${height - 64}" fill="${palette.fg}" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="2" opacity="0.55">TASTE SEED · ${escapeXml(params.seedKey)}</text>
</svg>`;

  return { svg, width, height, contentType: 'image/svg+xml' };
}

/** Documented fallback when storage upload is unavailable. */
export function remotePlaceholderUrl(seedKey: string, width = 800, height = 1000): string {
  const bg = seedKey
    .replace(/[^a-f0-9]/gi, '')
    .slice(0, 6)
    .padEnd(6, '3e5c4a');
  const label = encodeURIComponent(seedKey.slice(0, 18));
  return `https://placehold.co/${width}x${height}/${bg}/f6f4f1/png?text=${label}&font=source-sans-pro`;
}
