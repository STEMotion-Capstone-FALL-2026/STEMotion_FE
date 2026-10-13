import { FlatAmbience, FlatLayout, IllustratedIcon, SceneData } from '../types/stem';
import { FLAT_AMBIENCES, FLAT_LAYOUTS } from '../remotion/flat/theme';
import { isKnownStemIcon } from '../remotion/flat/stemIcons';

/**
 * Visual metaphors suggested by the AI for one scene (action "metaphor").
 *
 * Each option is a complete flat-explainer staging: what the viewer sees,
 * why it helps, where the comparison stops being true, and a narration
 * rewritten around it. The writer applies one, or none.
 */
export interface MetaphorOption {
  name: string;
  idea: string;
  whyItHelps?: string;
  limitation: string;
  layout: FlatLayout;
  ambience: FlatAmbience;
  headline: string;
  caption?: string;
  icons: IllustratedIcon[];
  narration: string;
}

const MAX_ICONS = 6;

/** Keeps only well-formed options, with layouts, ambiences and icons the renderer knows. */
export const parseMetaphorOptions = (result: unknown): MetaphorOption[] => {
  const raw = (result as { options?: unknown })?.options;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((o): o is Record<string, any> => !!o && typeof o === 'object')
    .map((o) => {
      const icons: IllustratedIcon[] = (Array.isArray(o.icons) ? o.icons : [])
        .filter((ic: any) => ic && typeof ic.name === 'string')
        .slice(0, MAX_ICONS)
        .map((ic: any) => ({
          name: isKnownStemIcon(ic.name) ? ic.name : 'sparkle',
          label: typeof ic.label === 'string' ? ic.label : undefined,
        }));
      return {
        name: String(o.name ?? '').trim(),
        idea: String(o.idea ?? '').trim(),
        whyItHelps: o.whyItHelps ? String(o.whyItHelps) : undefined,
        limitation: String(o.limitation ?? '').trim(),
        layout: (FLAT_LAYOUTS as string[]).includes(o.layout) ? o.layout : 'focus',
        ambience: (FLAT_AMBIENCES as string[]).includes(o.ambience) ? o.ambience : 'space',
        headline: String(o.headline ?? '').trim(),
        caption: o.caption ? String(o.caption) : undefined,
        icons,
        narration: String(o.narration ?? '').trim(),
      } as MetaphorOption;
    })
    .filter((o) => o.name && o.headline && o.icons.length >= (o.layout === 'exchange' || o.layout === 'zoom' ? 2 : 1));
};

/** Text sent to the AI: the scene's title and narration. */
export const describeSceneForMetaphor = (scene: SceneData): string =>
  `Tiêu đề cảnh: ${scene.title || '(chưa có)'}\nLời thoại: ${scene.narration || '(chưa có)'}`;

/**
 * Turns the scene into a flat-explainer staged around the metaphor. The
 * narration is replaced only when the writer asks for it.
 */
export const applyMetaphor = (scene: SceneData, option: MetaphorOption, withNarration: boolean): SceneData =>
  ({
    ...scene,
    type: 'ILLUSTRATED_EXPLAINER',
    headline: option.headline,
    caption: option.caption,
    layout: option.layout,
    ambience: option.ambience,
    icons: option.icons,
    narration: withNarration && option.narration ? option.narration : scene.narration,
  }) as SceneData;

/** Scene types that frame the video rather than explain a concept. */
export const canTakeMetaphor = (scene: SceneData) => scene.type !== 'TITLE_HERO' && scene.type !== 'OUTRO';
