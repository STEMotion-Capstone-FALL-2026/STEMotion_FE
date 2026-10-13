import { describe, expect, it } from 'vitest';
import { applyMetaphor, canTakeMetaphor, parseMetaphorOptions } from './metaphor';

const option = {
  name: 'Chuyền bóng',
  idea: 'Chất khử chuyền electron như chuyền bóng',
  limitation: 'Electron không bay theo đường cong như quả bóng',
  layout: 'exchange',
  ambience: 'lab',
  headline: 'Nhường bao nhiêu, nhận bấy nhiêu',
  icons: [
    { name: 'flask', label: 'Chất khử' },
    { name: 'test-tube', label: 'Chất oxi hoá' },
    { name: 'unicorn', label: 'electron' },
  ],
  narration: 'Hãy tưởng tượng electron là quả bóng...',
};

describe('parseMetaphorOptions', () => {
  it('keeps valid options and swaps unknown icons for the sparkle', () => {
    const [o] = parseMetaphorOptions({ options: [option] });
    expect(o.layout).toBe('exchange');
    expect(o.icons.map((i) => i.name)).toEqual(['flask', 'test-tube', 'sparkle']);
    expect(o.icons[2].label).toBe('electron');
  });

  it('falls back to safe layout and ambience values', () => {
    const [o] = parseMetaphorOptions({ options: [{ ...option, layout: 'spiral', ambience: 'jungle' }] });
    expect(o.layout).toBe('focus');
    expect(o.ambience).toBe('space');
  });

  it('drops options that cannot be staged', () => {
    expect(parseMetaphorOptions({ options: [{ ...option, headline: '' }] })).toHaveLength(0);
    expect(parseMetaphorOptions({ options: [{ ...option, icons: [{ name: 'flask' }] }] })).toHaveLength(0);
    expect(parseMetaphorOptions(null)).toEqual([]);
  });
});

describe('applyMetaphor', () => {
  const scene = { id: 's1', type: 'MATH_FORMULA', title: 'Oxi hoá khử', narration: 'Lời gốc', durationInFrames: 300 } as any;

  it('stages the scene as a flat explainer and keeps the narration by default', () => {
    const [o] = parseMetaphorOptions({ options: [option] });
    const next = applyMetaphor(scene, o, false) as any;
    expect(next).toMatchObject({ id: 's1', type: 'ILLUSTRATED_EXPLAINER', layout: 'exchange', narration: 'Lời gốc' });
    expect(next.icons).toHaveLength(3);
  });

  it('replaces the narration only when asked', () => {
    const [o] = parseMetaphorOptions({ options: [option] });
    expect((applyMetaphor(scene, o, true) as any).narration).toBe(option.narration);
  });
});

describe('canTakeMetaphor', () => {
  it('skips the title and outro scenes', () => {
    expect(canTakeMetaphor({ type: 'TITLE_HERO' } as any)).toBe(false);
    expect(canTakeMetaphor({ type: 'OUTRO' } as any)).toBe(false);
    expect(canTakeMetaphor({ type: 'MATH_FORMULA' } as any)).toBe(true);
  });
});
