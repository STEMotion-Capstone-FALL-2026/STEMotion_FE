import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { ComposedContentError, normalizeComposedBlocks } from './composed';
import { describeApproach, scriptService } from './scriptService';

describe('normalizeComposedBlocks', () => {
  it('repairs presentation slips: unknown icons, duplicate ids, dangling arrows', () => {
    const blocks = normalizeComposedBlocks([
      { id: 'a', kind: 'icon', icon: { name: 'unicorn', label: 'X' } },
      { id: 'a', kind: 'title', text: 'Hai' },
      { id: 'arr', kind: 'arrow', from: 'a', to: 'ghost' },
      { id: 'ring', kind: 'highlight', to: 'a' },
      { id: 'v', kind: 'video' },
    ]);
    expect(blocks.map((b) => b.id)).toEqual(['a', 'a_2', 'ring']);
    expect(blocks[0].icon).toEqual({ name: 'sparkle', label: 'X' });
  });

  it('refuses missing scientific content instead of inventing it', () => {
    expect(() => normalizeComposedBlocks([{ id: 'f', kind: 'formula' }])).toThrow(ComposedContentError);
    expect(() => normalizeComposedBlocks([{ id: 'n', kind: 'number', value: 'nhiều' }])).toThrow('giá trị số');
    expect(() => normalizeComposedBlocks([{ id: 'c', kind: 'chart', points: [{ label: 'A' }] }])).toThrow('số liệu');
    expect(() => normalizeComposedBlocks([{ id: 'q', kind: 'choice', options: ['A', 'B'], answer: 3 }])).toThrow('đáp án');
  });

  it('needs at least one content block', () => {
    expect(() => normalizeComposedBlocks([])).toThrow(ComposedContentError);
    expect(() => normalizeComposedBlocks([{ id: 't', kind: 'title', text: '  ' }])).toThrow('khối nội dung');
  });
});

describe('AI drafting with a chosen approach', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the approach and keeps composed scenes', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      result: {
        approachName: 'Gameshow',
        flow: ['Đặt câu hỏi', 'Lật đáp án'],
        scenes: [{
          type: 'COMPOSED', title: 'Câu hỏi', narration: 'Đáp án là tăng gấp đôi.', durationInFrames: 300,
          frame: 'split', ambience: 'jungle',
          blocks: [{ id: 'q', kind: 'choice', slot: 'left', options: ['Giảm', 'Gấp đôi'], answer: 1, revealAt: 'đáp án' }],
        }],
      },
    });
    const draft = await scriptService.generateScriptWithAI('Định luật Ôm', 'Physics', '11', 0, 'Dạy như một gameshow');
    expect(post.mock.calls[0][1]).toMatchObject({ approach: 'Dạy như một gameshow' });
    expect(draft.approachName).toBe('Gameshow');
    expect(draft.scenes[0]).toMatchObject({ type: 'COMPOSED', frame: 'split', ambience: 'space' });
  });

  it('rejects a composed scene with a formula the AI left empty', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      result: { scenes: [{ type: 'COMPOSED', frame: 'center', blocks: [{ id: 'f', kind: 'formula', latex: '' }] }] },
    });
    await expect(scriptService.generateScriptWithAI('Ôm', 'Physics', '11')).rejects.toThrow('phân cảnh 1');
  });

  it('lists suggested approaches and turns the chosen one into drafting text', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      result: { options: [{ name: 'Điều tra cầu chì', hook: 'Vì sao cầu chì cháy?', flow: ['Hiện trường', 'Thủ phạm'], whyItFits: 'Gần gũi' }, { name: '' }] },
    });
    const options = await scriptService.suggestApproaches('Định luật Ôm', 'Physics', '11');
    expect(options).toHaveLength(1);
    expect(describeApproach(options[0])).toBe('Điều tra cầu chì. Mở đầu: Vì sao cầu chì cháy?. Mạch: Hiện trường → Thủ phạm');
  });
});

describe('AI draft keeps the STEM phase of each scene', () => {
  afterEach(() => vi.restoreAllMocks());

  it('passes a valid phase through and drops an invalid one', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      result: {
        scenes: [
          { type: 'TITLE_HERO', title: 'Mở đầu', narration: 'x', stemPhase: 'PROBLEM' },
          { type: 'OUTRO', title: 'Kết', narration: 'y', stemPhase: 'HOMEWORK', summaryPoints: ['a'] },
        ],
      },
    });
    const draft = await scriptService.generateScriptWithAI('Ôm', 'Physics', '11');
    expect(draft.scenes[0].stemPhase).toBe('PROBLEM');
    expect(draft.scenes[1].stemPhase).toBeUndefined();
  });
});
