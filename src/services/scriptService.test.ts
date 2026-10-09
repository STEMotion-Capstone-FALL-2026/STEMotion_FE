import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { scriptService } from './scriptService';

describe('AI illustrated scenes', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(['flat', 'nested'])('preserves %s illustration props for project creation', async (shape) => {
    const props = {
      headline: 'Nguyên tử', caption: 'Cấu tạo nguyên tử', ambience: 'space',
      layout: 'focus', icons: [{ name: 'atom', label: 'Nguyên tử' }],
    };
    const scene = {
      type: 'ILLUSTRATED_EXPLAINER', title: 'Cấu tạo', narration: 'Lời thoại', durationInFrames: 90,
      ...(shape === 'flat' ? props : { props }),
    };
    vi.spyOn(apiClient, 'post').mockResolvedValue({ result: { scenes: [scene] } });
    const draft = await scriptService.generateScriptWithAI('Nguyên tử', 'Physics', '10');
    expect(draft.scenes[0]).toMatchObject({ ...props, narration: 'Lời thoại', durationInFrames: 90 });
  });

  it.each([undefined, null, []])('supplies a neutral icon when Gemini omits usable icons: %s', async (icons) => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ result: { scenes: [{
      type: 'ILLUSTRATED_EXPLAINER', title: 'Bài học', narration: 'Lời thoại gốc',
      durationInFrames: 90, icons,
    }] } });
    const draft = await scriptService.generateScriptWithAI('Bài học', 'Physics', '10');
    expect(draft.scenes[0]).toMatchObject({
      headline: 'Bài học', icons: [{ name: 'book', label: 'Bài học' }],
      ambience: 'sky', layout: 'focus', narration: 'Lời thoại gốc', durationInFrames: 90,
    });
  });
});
