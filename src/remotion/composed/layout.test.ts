import { describe, expect, it } from 'vitest';
import type { ComposedBlock } from '@/types/stem';
import { FRAMES, cueToFrame, findCue, fitFont, layoutBlocks, normalizeWords, resolveSlot, timeBlocks } from './layout';
import { OHM_DEMOS } from '../../lib/composedDemo';

const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('frames', () => {
  it('never lets two slots of the same frame overlap', () => {
    for (const [name, slots] of Object.entries(FRAMES)) {
      const rects = Object.values(slots);
      for (let i = 0; i < rects.length; i++)
        for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i]!, rects[j]!), name).toBe(false);
    }
  });

  it('keeps every slot inside the 1920x1080 screen', () => {
    for (const slots of Object.values(FRAMES))
      for (const r of Object.values(slots)) {
        expect(r!.x).toBeGreaterThanOrEqual(0);
        expect(r!.y).toBeGreaterThanOrEqual(0);
        expect(r!.x + r!.w).toBeLessThanOrEqual(1920);
        expect(r!.y + r!.h).toBeLessThanOrEqual(1080);
      }
  });

  it('moves a block to a nearby slot when the frame lacks the one asked for', () => {
    expect(resolveSlot('split', 'main')).toBe('left');
    expect(resolveSlot('grid', 'right')).toBe('tr');
    expect(resolveSlot('center', 'side')).toBe('main');
    expect(resolveSlot('thirds', undefined)).toBe('left');
  });
});

describe('cues', () => {
  it('matches words without Vietnamese tone marks or punctuation', () => {
    expect(normalizeWords('Định luật Ôm, đúng!')).toEqual(['dinh', 'luat', 'om', 'dung']);
    const words = normalizeWords('Hiệu điện thế tăng gấp đôi thì dòng điện cũng tăng gấp đôi.');
    expect(findCue(words, 'dòng điện')).toBe(7);
    expect(findCue(words, 'dong dien')).toBe(7);
    expect(findCue(words, 'không có')).toBe(-1);
  });

  it('maps a cue to a frame proportional to where the word is spoken', () => {
    const words = normalizeWords('một hai ba bốn năm sáu bảy tám chín mười');
    const early = cueToFrame(words, 'hai', 300)!;
    const late = cueToFrame(words, 'chín', 300)!;
    expect(early).toBeLessThan(late);
    expect(late).toBeLessThan(300);
    expect(cueToFrame(words, 'mười một', 300)).toBeNull();
  });
});

describe('timing and lanes', () => {
  const narration = 'Đầu tiên là câu hỏi. Sau đó là đáp án. Cuối cùng là công thức.';
  const block = (id: string, extra: Partial<ComposedBlock>): ComposedBlock => ({ id, kind: 'text', slot: 'main', text: id, ...extra });

  it('enters cued blocks on their word and uncued ones in order', () => {
    const t = timeBlocks([block('a', {}), block('b', {}), block('c', { at: 'công thức' })], narration, 300);
    expect(t[0].enter).toBeLessThan(t[1].enter);
    expect(t[2].enter).toBeGreaterThan(t[1].enter);
    expect(t[0].leave).toBe(Infinity);
  });

  it('stacks blocks shown together and reuses the lane of one that left', () => {
    const timed = timeBlocks(
      [
        block('q', { at: 'câu hỏi', until: 'đáp án' }),
        block('a', { at: 'đáp án' }),
        block('f', { at: 'công thức' }),
      ],
      narration,
      300
    );
    const rects = layoutBlocks('center', timed);
    // "a" replaces "q" in the same lane; "f" is shown with "a" and gets its own lane.
    expect(rects.get('a')).toEqual(rects.get('q'));
    expect(overlaps(rects.get('a')!, rects.get('f')!)).toBe(false);
  });

  it('lets overlays wait for the blocks they point at', () => {
    const t = timeBlocks(
      [block('x', { at: 'công thức' }), { id: 'ring', kind: 'highlight', to: 'x' }],
      narration,
      300
    );
    expect(t[1].enter).toBeGreaterThan(t[0].enter);
  });
});

describe('fitFont', () => {
  it('shrinks long text to fit and never goes below the minimum', () => {
    const short = fitFont('Ngắn', 800, 200, 90);
    const long = fitFont('Một câu dài hơn rất nhiều so với câu trước '.repeat(4), 800, 200, 90);
    expect(short).toBe(90);
    expect(long).toBeLessThan(short);
    expect(fitFont('x'.repeat(5000), 100, 50, 90, 20)).toBe(20);
  });
});

describe('Ohm demos', () => {
  it('cue every block to a word that is actually in its narration', () => {
    for (const demo of Object.values(OHM_DEMOS))
      for (const scene of demo.scenes) {
        const words = normalizeWords(scene.narration);
        for (const b of (scene as { blocks: ComposedBlock[] }).blocks)
          for (const cue of [b.at, b.until, b.revealAt, b.strikeAt].filter(Boolean))
            expect(findCue(words, cue), `${scene.id}/${b.id}: "${cue}"`).toBeGreaterThanOrEqual(0);
      }
  });
});
