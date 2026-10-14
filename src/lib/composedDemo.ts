import { ComposedBlock, ComposedFrame, ComposedProps, FlatAmbience, STEMScript } from '../types/stem';

/**
 * One lesson (Ohm's law, Physics 11) taught three different ways, all built
 * from the same composed-scene blocks and no template: an experiment, a game
 * show and an investigation. Registered in Remotion Studio as OhmExperiment,
 * OhmGameshow and OhmInvestigation. Scene lengths fit the measured narration;
 * rendering them with sound needs the render service on :4000 for the voice.
 */

const scene = (
  id: string,
  seconds: number,
  frame: ComposedFrame,
  ambience: FlatAmbience,
  title: string,
  narration: string,
  blocks: ComposedBlock[]
): ComposedProps => ({ id, type: 'COMPOSED', title, narration, durationInFrames: seconds * 30, frame, ambience, blocks });

const script = (id: string, title: string, scenes: ComposedProps[]): STEMScript => ({
  id,
  title,
  subject: 'Physics',
  gradeLevel: 'Lớp 11',
  scriptStatus: 'DRAFT',
  fps: 30,
  scenes,
});

export const OHM_EXPERIMENT = script('ohm-experiment', 'Định luật Ôm qua một thí nghiệm', [
  scene('ohm-exp-1', 11, 'split', 'lab', 'Bố trí thí nghiệm',
    'Hãy làm một thí nghiệm nhỏ. Mắc một điện trở vào nguồn điện, rồi lần lượt tăng hiệu điện thế và đọc số chỉ của ampe kế.',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'Thí nghiệm: đo dòng điện' },
      { id: 'kit', kind: 'icons', slot: 'left', at: 'mắc một', icons: [
        { name: 'battery', label: 'Nguồn điện' }, { name: 'plug', label: 'Điện trở' }, { name: 'gauge', label: 'Ampe kế' },
      ] },
      { id: 'steps', kind: 'list', slot: 'right', at: 'lần lượt', items: ['Tăng hiệu điện thế U', 'Đọc cường độ dòng điện I', 'Ghi lại từng cặp số'] },
    ]),
  scene('ohm-exp-2', 16, 'split', 'lab', 'Kết quả đo',
    'Với điện trở mười ôm: hai vôn cho không phẩy hai ampe, bốn vôn cho không phẩy bốn ampe, sáu vôn cho không phẩy sáu ampe. Hiệu điện thế tăng gấp đôi thì dòng điện cũng tăng gấp đôi.',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'Kết quả đo với R = 10 Ω' },
      { id: 'chart', kind: 'chart', slot: 'left', at: 'hai vôn', unit: 'A', points: [
        { label: '2 V', value: 0.2 }, { label: '4 V', value: 0.4 }, { label: '6 V', value: 0.6 },
      ] },
      { id: 'x2', kind: 'number', slot: 'right', at: 'tăng gấp đôi', value: 2, unit: 'lần', text: 'U gấp đôi thì I gấp đôi', emphasis: 'pulse' },
    ]),
  scene('ohm-exp-3', 9, 'center', 'space', 'Rút ra định luật',
    'Cường độ dòng điện tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với điện trở. Đó chính là định luật Ôm.',
    [
      { id: 'say', kind: 'text', slot: 'top', at: 'cường độ', text: 'I tỉ lệ thuận với U, tỉ lệ nghịch với R', motion: 'type' },
      { id: 'law', kind: 'formula', slot: 'main', at: 'tỉ lệ nghịch', latex: 'I = \\dfrac{U}{R}' },
      { id: 'ring', kind: 'highlight', to: 'law', at: 'định luật' },
      { id: 'name', kind: 'text', slot: 'bottom', at: 'định luật', text: 'Định luật Ôm', tone: 'accent' },
    ]),
]);

export const OHM_GAMESHOW = script('ohm-gameshow', 'Định luật Ôm qua một trò chơi', [
  scene('ohm-game-1', 12, 'sidebar', 'lilac', 'Câu hỏi khởi động',
    'Câu hỏi khởi động! Giữ nguyên điện trở, nếu tăng hiệu điện thế lên gấp đôi thì cường độ dòng điện sẽ thế nào? Đáp án là: tăng gấp đôi.',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'Ai nhanh hơn?', tone: 'accent' },
      { id: 'q', kind: 'choice', slot: 'main', at: 'giữ nguyên', question: 'Giữ R, tăng U gấp đôi thì I…', options: ['Giảm một nửa', 'Không đổi', 'Tăng gấp đôi', 'Tăng gấp bốn'], answer: 2, revealAt: 'đáp án' },
      { id: 'host', kind: 'guide', slot: 'side', pose: 'point', text: 'Bạn chọn đáp án nào?' },
    ]),
  scene('ohm-game-2', 13, 'split', 'space', 'Vì sao',
    'Vì sao? Định luật Ôm nói cường độ dòng điện bằng hiệu điện thế chia cho điện trở. Điện trở giữ nguyên, tử số gấp đôi thì kết quả cũng gấp đôi.',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'Giải thích' },
      { id: 'law', kind: 'formula', slot: 'left', at: 'định luật', latex: 'I = \\dfrac{U}{R}' },
      { id: 'double', kind: 'formula', slot: 'right', at: 'tử số', latex: "I' = \\dfrac{2U}{R} = 2I", tone: 'good' },
      { id: 'go', kind: 'arrow', from: 'law', to: 'double', at: 'tử số', text: 'U × 2' },
    ]),
  scene('ohm-game-3', 13, 'split', 'lilac', 'Câu hỏi tính nhanh',
    'Câu tiếp theo: điện trở hai mươi ôm, hiệu điện thế sáu vôn. Dòng điện bằng bao nhiêu? Lấy sáu chia hai mươi, được không phẩy ba ampe.',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'R = 20 Ω, U = 6 V. I = ?' },
      { id: 'q', kind: 'choice', slot: 'left', at: 'dòng điện bằng', options: ['0,3 A', '3 A', '120 A'], answer: 0, revealAt: 'được không' },
      { id: 'calc', kind: 'formula', slot: 'right', at: 'lấy sáu', latex: 'I = \\dfrac{6}{20} = 0{,}3\\ \\text{A}' },
    ]),
]);

export const OHM_INVESTIGATION = script('ohm-investigation', 'Định luật Ôm qua vụ cầu chì cháy', [
  scene('ohm-case-1', 10, 'sidebar', 'space', 'Hiện trường',
    'Một buổi tối, cầu chì trong nhà bỗng cháy khi bếp điện, máy sấy và ấm đun cùng được bật. Chuyện gì đã xảy ra?',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'Vụ án cầu chì cháy' },
      { id: 'scene', kind: 'icons', slot: 'main', at: 'bếp điện', icons: [
        { name: 'fire', label: 'Bếp điện' }, { name: 'wind', label: 'Máy sấy' }, { name: 'drop', label: 'Ấm đun' },
      ] },
      { id: 'det', kind: 'guide', slot: 'side', at: 'chuyện gì', pose: 'point', text: 'Cùng điều tra nhé!' },
    ]),
  scene('ohm-case-2', 12, 'split', 'cell', 'Nghi phạm sai',
    'Nhiều người nghĩ hiệu điện thế trong nhà bỗng tăng vọt. Sai rồi! Hiệu điện thế vẫn là hai trăm hai mươi vôn. Thứ tăng lên là cường độ dòng điện.',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'Nghi phạm số 1' },
      { id: 'myth', kind: 'text', slot: 'left', at: 'nhiều người', text: 'Hiệu điện thế tăng vọt?', tone: 'bad', strikeAt: 'sai rồi', emphasis: 'shake' },
      { id: 'u', kind: 'number', slot: 'right', at: 'vẫn là', value: 220, unit: 'V', text: 'U không đổi' },
      { id: 'clue', kind: 'text', slot: 'bottom', at: 'thứ tăng', text: 'Thứ tăng lên là cường độ dòng điện I', tone: 'accent' },
    ]),
  scene('ohm-case-3', 15, 'center', 'ocean', 'Thủ phạm',
    'Các thiết bị mắc song song nên điện trở tương đương của mạch giảm. Hiệu điện thế không đổi, theo định luật Ôm, điện trở càng nhỏ thì dòng điện càng lớn, vượt quá mức chịu đựng của cầu chì.',
    [
      { id: 't', kind: 'title', slot: 'top', text: 'Thủ phạm: R giảm' },
      { id: 'law', kind: 'formula', slot: 'main', at: 'theo định luật', latex: 'I = \\dfrac{U}{R}' },
      { id: 'ring', kind: 'highlight', to: 'law', at: 'điện trở càng nhỏ' },
      { id: 'end', kind: 'text', slot: 'bottom', at: 'vượt quá', text: 'R giảm → I tăng → cầu chì cháy', tone: 'accent' },
    ]),
]);

export const OHM_DEMOS = { OhmExperiment: OHM_EXPERIMENT, OhmGameshow: OHM_GAMESHOW, OhmInvestigation: OHM_INVESTIGATION };
