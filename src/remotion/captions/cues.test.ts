import { describe, expect, it } from 'vitest';
import { captionAt, groupCaptionLines, isCaptionWords } from './cues';

const words = (text: string, start = 0, step = 0.4) =>
  text.split(' ').map((w, i) => ({ text: w, start: start + i * step, end: start + i * step + 0.35 }));

describe('Whisper caption cues', () => {
  it('splits at sentence ends, long pauses and the line length', () => {
    const lines = groupCaptionLines([
      ...words('Định luật Ôm.'),
      ...words('Cường độ dòng điện tỉ lệ thuận với hiệu điện thế giữa hai đầu dây', 2),
      ...words('Hết', 10),
    ]);
    expect(lines[0].words.map((w) => w.text).join(' ')).toBe('Định luật Ôm.');
    expect(lines.every((l) => l.words.map((w) => w.text).join(' ').length <= 42)).toBe(true);
    expect(lines[lines.length - 1].words.map((w) => w.text)).toEqual(['Hết']);
  });

  it('shows the line being spoken and highlights the current word', () => {
    const lines = groupCaptionLines(words('U bằng I nhân R'));
    expect(captionAt(lines, 0.85)).toMatchObject({ activeIndex: 2 });
    expect(captionAt(lines, -1)).toBeNull();
    expect(captionAt(lines, 10)).toBeNull();
  });

  it('only accepts well-formed word lists', () => {
    expect(isCaptionWords(words('a b'))).toBe(true);
    expect(isCaptionWords([])).toBe(false);
    expect(isCaptionWords([{ text: 'a', start: 'x', end: 1 }])).toBe(false);
    expect(isCaptionWords(undefined)).toBe(false);
  });
});
