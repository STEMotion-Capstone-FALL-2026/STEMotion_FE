import { IllustratedExplainerProps, STEMScript } from '../types/stem';

/**
 * Showcase of the two storytelling layouts, built around visual metaphors
 * instead of fixed templates. Registered in Remotion Studio as "MetaphorDemo".
 *
 * Scene 1 pictures a redox reaction as handing electrons over (exchange);
 * scene 2 dives from a leaf down to an atom (zoom). Narration is empty so the
 * demo renders without the TTS service.
 */

const scene = (
  id: string,
  durationInFrames: number,
  props: Omit<IllustratedExplainerProps, 'id' | 'type' | 'narration' | 'durationInFrames'>
): IllustratedExplainerProps => ({
  id,
  type: 'ILLUSTRATED_EXPLAINER',
  narration: '',
  durationInFrames,
  ...props,
});

export const METAPHOR_DEMO_SCENES: IllustratedExplainerProps[] = [
  scene('metaphor_demo_1', 270, {
    title: 'Oxi hoá khử',
    headline: 'Nhường bao nhiêu, nhận bấy nhiêu',
    caption: 'Chất khử chuyền electron sang chất oxi hoá',
    ambience: 'lab',
    layout: 'exchange',
    icons: [
      { name: 'flask', label: 'Chất khử' },
      { name: 'test-tube', label: 'Chất oxi hoá' },
      { name: 'lightning', label: 'electron' },
    ],
  }),
  scene('metaphor_demo_2', 300, {
    title: 'Từ lá đến nguyên tử',
    headline: 'Đi sâu vào chiếc lá',
    caption: 'Mỗi lần phóng to là một thế giới mới',
    ambience: 'cell',
    layout: 'zoom',
    icons: [
      { name: 'leaf', label: 'Lá cây' },
      { name: 'hexagon', label: 'Tế bào' },
      { name: 'dna', label: 'ADN' },
      { name: 'atom', label: 'Nguyên tử' },
    ],
  }),
];

export const METAPHOR_DEMO_SCRIPT: STEMScript = {
  id: 'metaphor_demo',
  title: 'Ẩn dụ hình ảnh (bản demo bố cục kể chuyện)',
  subject: 'Chemistry',
  gradeLevel: 'Lớp 10',
  scriptStatus: 'DRAFT',
  fps: 30,
  scenes: METAPHOR_DEMO_SCENES,
};
