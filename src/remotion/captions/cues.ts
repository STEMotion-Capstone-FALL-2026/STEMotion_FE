/**
 * Word-timed captions from Whisper forced alignment (the render worker puts
 * them on each scene as `captionWords`, in seconds from the scene's start).
 * Words are grouped into short lines that fit the lower third of the frame.
 */
export interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

export interface CaptionLine {
  words: CaptionWord[];
  start: number;
  end: number;
}

/** A line closes at this many characters or words, or at a sentence end. */
const MAX_LINE_CHARS = 42;
const MAX_LINE_WORDS = 9;
/** A pause this long between words also starts a new line. */
const LINE_BREAK_GAP_SEC = 0.6;

export const isCaptionWords = (value: unknown): value is CaptionWord[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((w) => w && typeof w.text === 'string' && Number.isFinite(w.start) && Number.isFinite(w.end));

export const groupCaptionLines = (words: CaptionWord[]): CaptionLine[] => {
  const lines: CaptionLine[] = [];
  let current: CaptionWord[] = [];
  let chars = 0;
  const close = () => {
    if (current.length) lines.push({ words: current, start: current[0].start, end: current[current.length - 1].end });
    current = [];
    chars = 0;
  };
  words.forEach((word, i) => {
    const previous = words[i - 1];
    if (current.length && (
      chars + 1 + word.text.length > MAX_LINE_CHARS ||
      current.length >= MAX_LINE_WORDS ||
      (previous && word.start - previous.end >= LINE_BREAK_GAP_SEC)
    )) close();
    current.push(word);
    chars += (current.length > 1 ? 1 : 0) + word.text.length;
    if (/[.!?…]$/.test(word.text)) close();
  });
  close();
  return lines;
};

/** The line on screen at `time` (seconds) and the word being spoken, if any. */
export const captionAt = (lines: CaptionLine[], time: number): { line: CaptionLine; activeIndex: number } | null => {
  // A line appears slightly before its first word and stays until the next line starts.
  const index = lines.findIndex((line, i) => {
    const next = lines[i + 1];
    const until = next ? next.start - 0.05 : line.end + 0.8;
    return time >= line.start - 0.15 && time < until;
  });
  if (index < 0) return null;
  const line = lines[index];
  let activeIndex = -1;
  line.words.forEach((word, i) => {
    if (time >= word.start) activeIndex = i;
  });
  return { line, activeIndex };
};
