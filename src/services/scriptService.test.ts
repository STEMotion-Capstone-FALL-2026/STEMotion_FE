import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { scriptService } from './scriptService';

describe('AI decision contract', () => {
  afterEach(() => vi.restoreAllMocks());
  it('keeps the request id returned by the gateway', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({result:{score:80},requestId:'owned-id',model:'stub',elapsedMs:2});
    expect(await scriptService.runAiAction('grade','Force')).toMatchObject({requestId:'owned-id',model:'stub'});
  });
  it.each(['ACCEPTED','IGNORED'] as const)('persists explicit %s without saving the draft', async (decision) => {
    const put=vi.spyOn(apiClient,'put').mockResolvedValue({decision});
    await scriptService.decideAiRequest('owned-id',decision);
    expect(put).toHaveBeenCalledExactlyOnceWith('/ai/requests/owned-id/decision',{decision});
  });
  it('does not treat a failed decision request as success', async () => {
    vi.spyOn(apiClient,'put').mockRejectedValue(new Error('Forbidden'));
    await expect(scriptService.decideAiRequest('other-id','ACCEPTED')).rejects.toThrow('Forbidden');
  });
});

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
      headline: 'Bài học', icons: [{ name: 'sparkle', label: 'Bài học' }],
      ambience: 'space', layout: 'focus', narration: 'Lời thoại gốc', durationInFrames: 90,
    });
  });
});

describe('AI scientific content integrity', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(['MATH_FORMULA', 'CHEMICAL_REACTION', 'STEM_QUIZ', 'DATA_CHART', 'PROCESS_TIMELINE'])
    ('rejects missing scientific content instead of fabricating %s', async (type) => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({ result: { scenes: [{ type, title: 'Lesson' }] } });
      await expect(scriptService.generateScriptWithAI('Lesson', 'Physics', '10')).rejects.toThrow('phân cảnh 1');
    });

  it('keeps a complete process timeline as given', async () => {
    const stages = [
      { stageNumber: 1, title: 'Hấp thụ ánh sáng', description: 'Diệp lục bắt photon' },
      { stageNumber: 2, title: 'Cố định CO₂', description: 'Chu trình Calvin' },
    ];
    vi.spyOn(apiClient, 'post').mockResolvedValue({ result: { scenes: [{ type: 'PROCESS_TIMELINE', processTitle: 'Quang hợp', stages }] } });
    const draft = await scriptService.generateScriptWithAI('Lesson', 'Biology', '10');
    expect(draft.scenes[0]).toMatchObject({ processTitle: 'Quang hợp', stages: stages.map((s) => expect.objectContaining(s)) });
  });

  it('rejects an empty AI response', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ result: { scenes: [] } });
    await expect(scriptService.generateScriptWithAI('Lesson', 'Physics', '10')).rejects.toThrow('phân cảnh hợp lệ');
  });

  it('preserves a valid nested quiz including answer index zero', async () => {
    const props = { question: 'Question', options: ['Correct', 'Incorrect'], correctIndex: 0 };
    vi.spyOn(apiClient, 'post').mockResolvedValue({ result: { scenes: [{ type: 'STEM_QUIZ', props }] } });
    const draft = await scriptService.generateScriptWithAI('Lesson', 'Physics', '10');
    expect(draft.scenes[0]).toMatchObject(props);
  });

  it('rejects a quiz answer outside the supplied options', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ result: { scenes: [{
      type: 'STEM_QUIZ', question: 'Question', options: ['A', 'B'], correctIndex: 2,
    }] } });
    await expect(scriptService.generateScriptWithAI('Lesson', 'Physics', '10')).rejects.toThrow('phân cảnh 1');
  });
});
