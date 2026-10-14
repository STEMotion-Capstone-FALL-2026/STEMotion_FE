import type { ComposedBlock, ComposedBlockKind, ComposedFrame, ComposedSlot } from '@/types/stem';

/**
 * Layout and timing for composed scenes, kept free of React so it can be
 * tested on its own.
 *
 * A frame divides the 1920x1080 screen into slots that never overlap. Blocks
 * in the same slot share it: blocks shown at the same time stack vertically
 * in lanes, and a block that appears after another one has left reuses its
 * lane. Entrances and exits are cued by words of the narration, mapped to
 * frames by where the word falls in the text.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

export const FRAMES: Record<ComposedFrame, Partial<Record<ComposedSlot, Rect>>> = {
  center: { top: r(96, 64, 1728, 190), main: r(160, 280, 1600, 540), bottom: r(96, 850, 1728, 170) },
  split: { top: r(96, 64, 1728, 170), left: r(96, 260, 840, 580), right: r(984, 260, 840, 580), bottom: r(96, 866, 1728, 150) },
  thirds: {
    top: r(96, 64, 1728, 170),
    left: r(96, 260, 544, 590),
    middle: r(688, 260, 544, 590),
    right: r(1280, 260, 544, 590),
    bottom: r(96, 876, 1728, 140),
  },
  grid: {
    top: r(96, 56, 1728, 150),
    tl: r(96, 226, 840, 380),
    tr: r(984, 226, 840, 380),
    bl: r(96, 630, 840, 380),
    br: r(984, 630, 840, 380),
  },
  sidebar: { top: r(96, 64, 1728, 170), main: r(96, 256, 1180, 760), side: r(1316, 256, 508, 760) },
};

export const COMPOSED_FRAMES = Object.keys(FRAMES) as ComposedFrame[];

/** Kinds drawn over other blocks; they take no slot. */
export const OVERLAY_KINDS: ComposedBlockKind[] = ['arrow', 'highlight'];

/** Where a block goes when its slot is not part of the chosen frame. */
const SLOT_FALLBACK: Partial<Record<ComposedSlot, ComposedSlot[]>> = {
  main: ['middle', 'left', 'tl'],
  middle: ['main', 'left', 'tl'],
  left: ['tl', 'main', 'middle'],
  right: ['tr', 'side', 'main', 'middle'],
  side: ['right', 'tr', 'main'],
  tl: ['left', 'main'],
  tr: ['right', 'side', 'main'],
  bl: ['left', 'bottom', 'main'],
  br: ['right', 'bottom', 'side', 'main'],
  top: ['main'],
  bottom: ['main'],
};

export const resolveSlot = (frame: ComposedFrame, slot: ComposedSlot | undefined): ComposedSlot => {
  const slots = FRAMES[frame] ?? FRAMES.center;
  if (slot && slots[slot]) return slot;
  for (const alt of (slot && SLOT_FALLBACK[slot]) || []) if (slots[alt]) return alt;
  const content = (Object.keys(slots) as ComposedSlot[]).filter((s) => s !== 'top' && s !== 'bottom');
  return content[0] ?? 'main';
};

/** Lower case, no Vietnamese tone marks, no punctuation: cues match even when the AI drops a mark. */
export const normalizeWords = (text: string): string[] =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Index of the first word of `cue` inside the narration, or -1. */
export const findCue = (narrationWords: string[], cue: string | undefined): number => {
  if (!cue) return -1;
  const target = normalizeWords(cue);
  if (target.length === 0) return -1;
  for (let i = 0; i + target.length <= narrationWords.length; i++) {
    if (target.every((w, k) => narrationWords[i + k] === w)) return i;
  }
  return -1;
};

/** Narration is spoken from LEAD frames in until SPEECH_END of the scene. */
const LEAD = 6;
const SPEECH_END = 0.94;

export const cueToFrame = (narrationWords: string[], cue: string | undefined, duration: number): number | null => {
  const index = findCue(narrationWords, cue);
  if (index < 0 || narrationWords.length === 0) return null;
  return Math.round(LEAD + (index / narrationWords.length) * (duration * SPEECH_END - LEAD));
};

export interface Timed {
  block: ComposedBlock;
  /** Frame the block starts to enter. */
  enter: number;
  /** Frame the block starts to leave; Infinity when it stays. */
  leave: number;
  reveal: number | null;
  strike: number | null;
}

/**
 * Entrance and exit frames for every block. Uncued blocks enter one after
 * another in their listed order; overlays wait for the blocks they point at.
 */
export const timeBlocks = (blocks: ComposedBlock[], narration: string, duration: number): Timed[] => {
  const words = normalizeWords(narration || '');
  const step = Math.max(10, Math.min(45, (duration * 0.5) / Math.max(1, blocks.length)));
  const timed = blocks.map((block, order) => {
    const cued = cueToFrame(words, block.at, duration);
    const enter = Math.min(duration - 15, cued ?? Math.round(8 + order * step));
    const until = cueToFrame(words, block.until, duration);
    return {
      block,
      enter,
      leave: until !== null && until > enter + 10 ? until : Infinity,
      reveal: cueToFrame(words, block.revealAt, duration),
      strike: cueToFrame(words, block.strikeAt, duration),
    };
  });
  const byId = new Map(timed.map((t) => [t.block.id, t]));
  for (const t of timed) {
    if (!OVERLAY_KINDS.includes(t.block.kind) || t.block.at) continue;
    const refs = [t.block.from, t.block.to].map((id) => (id ? byId.get(id) : undefined)).filter(Boolean) as Timed[];
    if (refs.length) t.enter = Math.min(duration - 15, Math.max(t.enter, ...refs.map((x) => x.enter + 14)));
  }
  return timed;
};

/** Relative height a block asks for when it shares a slot. */
export const blockWeight = (block: ComposedBlock): number => {
  switch (block.kind) {
    case 'title':
      return 1;
    case 'text':
      return 1.2;
    case 'list':
      return 1 + 0.5 * (block.items?.length ?? 1);
    case 'formula':
      return 1.4;
    case 'icon':
      return 1.7;
    case 'icons':
      return 1.5;
    case 'number':
      return 1.3;
    case 'chart':
      return 2.4;
    case 'choice':
      return 1 + 0.5 * (block.options?.length ?? 2);
    case 'guide':
      return 2.2;
    default:
      return 1;
  }
};

const LANE_GAP = 24;

/** Rectangles for every slotted block, keyed by block id. */
export const layoutBlocks = (frame: ComposedFrame, timed: Timed[]): Map<string, Rect> => {
  const slots = FRAMES[frame] ?? FRAMES.center;
  const bySlot = new Map<ComposedSlot, Timed[]>();
  for (const t of timed) {
    if (OVERLAY_KINDS.includes(t.block.kind)) continue;
    const slot = resolveSlot(frame, t.block.slot);
    bySlot.set(slot, [...(bySlot.get(slot) ?? []), t]);
  }

  const rects = new Map<string, Rect>();
  for (const [slot, list] of bySlot) {
    const area = slots[slot]!;
    // Greedy lanes: a block reuses the first lane whose occupant has already left.
    const lanes: Timed[][] = [];
    for (const t of [...list].sort((a, b) => a.enter - b.enter)) {
      const lane = lanes.find((l) => l[l.length - 1].leave <= t.enter);
      if (lane) lane.push(t);
      else lanes.push([t]);
    }
    // Lanes keep the order the blocks were listed in, so the author decides what is on top.
    lanes.sort((a, b) => list.indexOf(a[0]) - list.indexOf(b[0]));
    const weights = lanes.map((l) => Math.max(...l.map((t) => blockWeight(t.block))));
    const total = weights.reduce((a, b) => a + b, 0);
    const free = area.h - LANE_GAP * (lanes.length - 1);
    let y = area.y;
    lanes.forEach((lane, i) => {
      const h = (free * weights[i]) / total;
      for (const t of lane) rects.set(t.block.id, { x: area.x, y, w: area.w, h });
      y += h + LANE_GAP;
    });
  }
  return rects;
};

/**
 * Largest font size (up to `max`) at which `text` fits the box, estimated from
 * an average glyph width. Deterministic, so every render agrees.
 */
export const fitFont = (text: string, w: number, h: number, max: number, min = 20, lineHeight = 1.22): number => {
  const length = Math.max(1, (text || '').length);
  for (let size = max; size > min; size -= 2) {
    const perLine = Math.max(1, Math.floor(w / (size * 0.52)));
    const lines = Math.ceil(length / perLine);
    if (lines * size * lineHeight <= h) return size;
  }
  return min;
};
