import { loadFont } from '@remotion/google-fonts/Baloo2';
import type { FlatAmbience, FlatDetail, FlatLayout } from '@/types/stem';

/**
 * Flat-explainer visual language. A frame is one strong colour field with a
 * single clear subject on it: saturated accents, a restrained glow on the hero
 * object only, rounded heavy type and coloured label tags. Every flat scene
 * reads its colours from here so a whole video stays on one palette.
 */

const font = loadFont('normal', {
  weights: ['600', '800'],
  subsets: ['vietnamese', 'latin'],
});

export const FLAT_FONT = `${font.fontFamily}, 'Nunito', system-ui, sans-serif`;

export type { FlatAmbience, FlatDetail, FlatLayout };

export const FLAT_AMBIENCES: FlatAmbience[] = ['space', 'cell', 'lab', 'ocean', 'lilac', 'sky'];
export const FLAT_LAYOUTS: FlatLayout[] = ['focus', 'row', 'cluster', 'swarm'];

export interface AmbiencePalette {
  /** Background gradient, centre to edge. */
  sky: [string, string, string];
  /** Soft shapes, only drawn when the scene asks for a rich backdrop. */
  blobs: string[];
  /** Small particles: stars, bubbles, specks. */
  speck: string;
  /** Light pastel scenes take dark type. */
  light: boolean;
  text: string;
  textSoft: string;
}

const DARK_TEXT = { light: false, text: '#fff8e8', textSoft: '#e7d9ff' };
const LIGHT_TEXT = { light: true, text: '#2b0a5e', textSoft: '#4a1d86' };

/*
 * Palettes are calibrated against reference explainer frames: deep, fully
 * saturated violets and blues for the field, teal/cyan and warm orange-pink
 * accents, and light scenes that stay saturated instead of washing to white.
 */
export const AMBIENCE: Record<FlatAmbience, AmbiencePalette> = {
  space: { sky: ['#4b1ba3', '#2e0a6e', '#14023a'], blobs: ['#7b3cff', '#ff3d9a', '#2fa8ff'], speck: '#fff3c4', ...DARK_TEXT },
  cell: { sky: ['#8a1f9e', '#560f78', '#260541'], blobs: ['#ff3d9a', '#ffb13d', '#3ff0c8'], speck: '#ffd1f0', ...DARK_TEXT },
  lab: { sky: ['#2f45c8', '#1c2386', '#0c0c45'], blobs: ['#9b6bff', '#ff8a3d', '#3ff0e6'], speck: '#d9f4ff', ...DARK_TEXT },
  ocean: { sky: ['#0fa0b8', '#0a6595', '#062c5c'], blobs: ['#3ff0e6', '#5cf2a8', '#4f7bff'], speck: '#dcfffb', ...DARK_TEXT },
  lilac: { sky: ['#e7b8ff', '#c98af2', '#9d55d9'], blobs: ['#ff7ad0', '#ffffff', '#8f6bff'], speck: '#fff6ff', ...LIGHT_TEXT },
  sky: { sky: ['#b5fff2', '#6fe3d2', '#2fb4b6'], blobs: ['#ffffff', '#3ff0e6', '#4f9bff'], speck: '#ffffff', ...LIGHT_TEXT },
};

export const paletteFor = (ambience: FlatAmbience | undefined): AmbiencePalette =>
  AMBIENCE[ambience ?? 'space'] ?? AMBIENCE.space;

/** Accent colours handed out to objects in order. */
export const ACCENTS = ['#ffd23f', '#ff3d9a', '#3ff0e6', '#ff8a3d', '#5cf2a8', '#9b6bff'];

export const accentAt = (index: number) =>
  ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length];

/** Shadows lean toward deep violet and highlights toward warm cream, never to black or white. */
const SHADOW = '#1a0848';
const HIGHLIGHT = '#fff6d6';

const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.replace('#', '').slice(0, 6), 16);
  const pb = parseInt(b.replace('#', '').slice(0, 6), 16);
  const k = Math.min(1, Math.max(0, t));
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 0xff) + ((((pb >> shift) & 0xff) - ((pa >> shift) & 0xff)) * k))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

/** Lightens (amount > 0) toward cream or darkens (amount < 0) toward violet. */
export const shade = (hex: string, amount: number) =>
  amount >= 0 ? mix(hex, HIGHLIGHT, amount) : mix(hex, SHADOW, -amount);

export { mix };

/** Two-ring glow, used on the hero object only. */
export const glow = (color: string, radius = 40) =>
  `0 0 ${radius}px ${color}66, 0 0 ${radius * 2.2}px ${color}2e`;
