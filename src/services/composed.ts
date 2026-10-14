import type { ComposedBlock, ComposedFrame, ComposedProps } from '../types/stem';
import { isKnownStemIcon } from '../remotion/flat/stemIcons';
import { FLAT_AMBIENCES } from '../remotion/flat/theme';
import { COMPOSED_FRAMES, OVERLAY_KINDS } from '../remotion/composed/layout';

/**
 * Cleans the blocks of an AI-drafted COMPOSED scene before it reaches the
 * editor. Presentation slips are repaired (an unknown icon becomes the
 * sparkle, an arrow pointing nowhere is dropped, a duplicate id is renamed);
 * missing scientific content is not: a formula without LaTeX, a chart with a
 * non-numeric value or a quiz answer outside its options is an error, never a
 * placeholder. Mirrors ComposedSceneValidator on the back end.
 */

const KINDS: ComposedBlock['kind'][] = [
  'title', 'text', 'list', 'formula', 'icon', 'icons', 'number', 'chart', 'choice', 'arrow', 'highlight', 'guide',
];
const MAX_BLOCKS = 12;

export class ComposedContentError extends Error {}

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const icon = (ic: any) => ({
  name: nonEmpty(ic?.name) && isKnownStemIcon(ic.name) ? ic.name : 'sparkle',
  ...(nonEmpty(ic?.label) ? { label: ic.label.trim() } : {}),
});

export const normalizeComposedBlocks = (raw: unknown): ComposedBlock[] => {
  if (!Array.isArray(raw) || raw.length === 0) throw new ComposedContentError('cảnh lắp ghép không có khối nào');
  const used = new Set<string>();
  const blocks: ComposedBlock[] = [];

  raw.slice(0, MAX_BLOCKS).forEach((b: any, i) => {
    if (!b || typeof b !== 'object' || !KINDS.includes(b.kind)) return;
    let id = nonEmpty(b.id) ? b.id.trim() : `b${i + 1}`;
    while (used.has(id)) id = `${id}_${i + 1}`;
    used.add(id);
    const block: ComposedBlock = { ...b, id };

    switch (b.kind) {
      case 'title':
      case 'text':
        if (!nonEmpty(b.text)) return;
        break;
      case 'list':
        block.items = (Array.isArray(b.items) ? b.items : []).filter(nonEmpty).slice(0, 6);
        if (block.items!.length === 0) return;
        break;
      case 'formula':
        if (!nonEmpty(b.latex)) throw new ComposedContentError(`khối công thức "${id}" không có LaTeX`);
        break;
      case 'icon':
        block.icon = icon(b.icon);
        break;
      case 'icons':
        block.icons = (Array.isArray(b.icons) ? b.icons : []).slice(0, 6).map(icon);
        if (block.icons!.length === 0) return;
        break;
      case 'number':
        if (typeof b.value !== 'number' || !Number.isFinite(b.value)) throw new ComposedContentError(`khối số "${id}" không có giá trị số`);
        break;
      case 'chart':
        if (!Array.isArray(b.points) || b.points.length === 0
          || !b.points.every((p: any) => nonEmpty(p?.label) && typeof p.value === 'number' && Number.isFinite(p.value))) {
          throw new ComposedContentError(`biểu đồ "${id}" thiếu số liệu`);
        }
        block.points = b.points.slice(0, 8);
        break;
      case 'choice': {
        const options = (Array.isArray(b.options) ? b.options : []).filter(nonEmpty).slice(0, 4);
        if (options.length < 2 || !Number.isInteger(b.answer) || b.answer < 0 || b.answer >= options.length) {
          throw new ComposedContentError(`câu hỏi "${id}" thiếu phương án hoặc đáp án`);
        }
        block.options = options;
        break;
      }
      default:
        break;
    }
    blocks.push(block);
  });

  // Overlays may only point at blocks that survived.
  const ids = new Set(blocks.map((b) => b.id));
  const kept = blocks.filter((b) => {
    if (b.kind === 'arrow') return !!b.from && !!b.to && b.from !== b.to && ids.has(b.from) && ids.has(b.to);
    if (b.kind === 'highlight') return !!b.to && b.to !== b.id && ids.has(b.to);
    return true;
  });
  if (kept.every((b) => OVERLAY_KINDS.includes(b.kind))) throw new ComposedContentError('cảnh lắp ghép không có khối nội dung');
  return kept;
};

/** The composed part of an AI scene, with a safe frame and ambience. */
export const composedPropsFrom = (sc: any): Pick<ComposedProps, 'frame' | 'ambience' | 'blocks'> => {
  const value = (key: string) => sc?.[key] ?? sc?.props?.[key];
  const frame = (COMPOSED_FRAMES as string[]).includes(value('frame')) ? (value('frame') as ComposedFrame) : 'center';
  const ambience = (FLAT_AMBIENCES as string[]).includes(value('ambience')) ? value('ambience') : 'space';
  return { frame, ambience, blocks: normalizeComposedBlocks(value('blocks')) };
};
