import { IllustratedExplainerProps, STEMScript } from '../types/stem';

/**
 * A 25-second showcase of the flat-explainer style (photosynthesis, Biology).
 * Registered in Remotion Studio as "FlatExplainerDemo". Narration is left
 * empty so the demo renders without the TTS service running.
 */

const scene = (
  id: string,
  props: Omit<IllustratedExplainerProps, 'id' | 'type' | 'narration' | 'durationInFrames'>
): IllustratedExplainerProps => ({
  id,
  type: 'ILLUSTRATED_EXPLAINER',
  narration: '',
  durationInFrames: 150,
  ...props,
});

export const FLAT_DEMO_SCENES: IllustratedExplainerProps[] = [
  scene('flat_demo_1', {
    title: 'Mở đầu',
    headline: 'Quang hợp',
    caption: 'Cách lá cây biến ánh sáng thành thức ăn',
    ambience: 'cell',
    layout: 'focus',
    icons: [
      { name: 'leaf', label: 'Lá cây' },
      { name: 'sun', label: 'Ánh sáng' },
      { name: 'drop', label: 'Nước' },
      { name: 'wind', label: 'Khí CO₂' },
      { name: 'sparkle', label: 'Glucôzơ' },
    ],
  }),
  scene('flat_demo_2', {
    title: 'Nguyên liệu',
    headline: 'Ba nguyên liệu, một sản phẩm',
    caption: 'Ánh sáng, nước và CO₂ gặp nhau trong lục lạp',
    ambience: 'lab',
    layout: 'row',
    icons: [
      { name: 'sun', label: 'Ánh sáng' },
      { name: 'drop', label: 'Nước' },
      { name: 'wind', label: 'CO₂' },
      { name: 'flask', label: 'Glucôzơ + O₂' },
    ],
  }),
  scene('flat_demo_3', {
    title: 'Lục lạp',
    headline: 'Hàng triệu nhà máy tí hon',
    caption: 'Mỗi tế bào lá chứa hàng chục lục lạp',
    ambience: 'cell',
    layout: 'swarm',
    icons: [
      { name: 'leaf', label: 'Lục lạp' },
      { name: 'sun', label: 'Hấp thụ ánh sáng' },
      { name: 'drop', label: 'Tách nước' },
    ],
  }),
  scene('flat_demo_4', {
    title: 'Năng lượng',
    headline: 'Mọi năng lượng đều bắt đầu từ Mặt Trời',
    ambience: 'sky',
    layout: 'focus',
    icons: [
      { name: 'sun', label: 'Mặt Trời' },
      { name: 'globe', label: 'Trái Đất' },
      { name: 'plant', label: 'Thực vật' },
      { name: 'animal', label: 'Động vật' },
    ],
  }),
  scene('flat_demo_5', {
    title: 'Ứng dụng',
    headline: 'Quang hợp nuôi sống cả hành tinh',
    caption: 'Thức ăn, khí thở và nhiên liệu đều nhờ nó',
    ambience: 'lilac',
    layout: 'cluster',
    icons: [
      { name: 'grains', label: 'Lương thực' },
      { name: 'person', label: 'Khí O₂' },
      { name: 'fish', label: 'Tảo biển' },
      { name: 'fire', label: 'Nhiên liệu' },
    ],
  }),
];

export const FLAT_DEMO_SCRIPT: STEMScript = {
  id: 'flat_demo',
  title: 'Quang hợp (bản demo phong cách flat explainer)',
  subject: 'Biology',
  gradeLevel: 'Lớp 10',
  scriptStatus: 'DRAFT',
  fps: 30,
  scenes: FLAT_DEMO_SCENES,
};
