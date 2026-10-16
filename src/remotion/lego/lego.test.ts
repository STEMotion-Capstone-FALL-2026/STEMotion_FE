import { describe, it, expect } from 'vitest';
import { getSceneLegoPieces, createLegoBlockPreset } from './catalog';
import { decomposeSceneToComposed } from './decompose';
import { layoutBlocks, timeBlocks } from '../composed/layout';
import type { MathFormulaProps, TitleHeroProps, ComposedProps, ComposedBlock } from '../../types/stem';

describe('Remotion Lego Modularization System', () => {
  it('extracts modular Lego pieces for TITLE_HERO and supports inline text patching', () => {
    const scene: TitleHeroProps = {
      id: 's1',
      type: 'TITLE_HERO',
      title: 'Định luật II Newton',
      subtitle: 'Mối quan hệ giữa Lực, Khối lượng và Gia tốc',
      badgeText: 'Vật Lý 10',
      subject: 'Physics',
      gradeLevel: 'Lớp 10',
      durationInFrames: 150,
      narration: 'Chào mừng các em đến với bài học.',
    };

    const pieces = getSceneLegoPieces(scene);
    expect(pieces.map((p) => p.id)).toEqual(['badge', 'title', 'subtitle']);

    const titlePiece = pieces.find((p) => p.id === 'title')!;
    expect(titlePiece.textValue).toBe('Định luật II Newton');
    const patch = titlePiece.buildTextPatch!('Định luật III Newton');
    expect(patch).toEqual({ title: 'Định luật III Newton' });
  });

  it('extracts modular Lego pieces for MATH_FORMULA including each step and extraBlocks', () => {
    const extra = createLegoBlockPreset('text', 1);
    const scene: MathFormulaProps = {
      id: 's2',
      type: 'MATH_FORMULA',
      title: 'Phương trình bậc hai',
      latex: 'ax^2 + bx + c = 0',
      steps: [
        { label: 'B1', latexSnippet: '\\Delta = b^2 - 4ac', explanation: 'Tính biệt thức Delta' },
        { label: 'B2', latexSnippet: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', explanation: 'Tìm nghiệm' },
      ],
      durationInFrames: 180,
      narration: 'Giải phương trình bậc hai.',
      extraBlocks: [extra],
    };

    const pieces = getSceneLegoPieces(scene);
    expect(pieces.map((p) => p.id)).toEqual([
      'header',
      'formula-card',
      'step-0',
      'step-1',
      extra.id,
    ]);
  });

  it('decomposes fixed template scenes into freeform COMPOSED scenes preserving layout offsets', () => {
    const scene: MathFormulaProps = {
      id: 's3',
      type: 'MATH_FORMULA',
      title: 'Định lý Vi-ét',
      latex: 'x_1 + x_2 = -\\frac{b}{a}',
      steps: [{ label: 'Tích hai nghiệm', latexSnippet: 'x_1 x_2 = \\frac{c}{a}', explanation: 'Hệ thức tích' }],
      durationInFrames: 180,
      narration: 'Định lý Vi-ét.',
      componentLayouts: {
        'formula-card': { dx: 120, dy: -40, scale: 1.2 },
      },
    };

    const composed: ComposedProps = decomposeSceneToComposed(scene);
    expect(composed.type).toBe('COMPOSED');
    expect(composed.blocks.length).toBe(3);

    const formulaBlock = composed.blocks.find((b) => b.id === 'math_formula')!;
    expect(formulaBlock.x).toBe(88 + 120);
    expect(formulaBlock.y).toBe(270 - 40);
    expect(formulaBlock.w).toBe(Math.round(820 * 1.2));
  });

  it('overrides COMPOSED slot rects when freeform x, y, w, h are set on a block', () => {
    const blocks: ComposedBlock[] = [
      {
        id: 'b1',
        kind: 'title',
        slot: 'main',
        text: 'Tiêu đề tự do',
        x: 300,
        y: 150,
        w: 900,
        h: 220,
      },
      {
        id: 'hl1',
        kind: 'highlight',
        from: 'b1',
        text: 'Chú ý',
      },
    ];

    const timed = timeBlocks(blocks, 'Tiêu đề tự do chú ý', 180);
    const rects = layoutBlocks('center', timed);

    expect(rects.get('b1')).toEqual({ x: 300, y: 150, w: 900, h: 220 });
  });
});
