import { describe, expect, it, vi } from 'vitest';
import { createCompositionSaver, type Composition } from './compositionService';

const scenes = (label: string) => [{ id: 's1', title: label }] as any;
const saved = (revision: number): Composition =>
  ({ projectId: 'p', scriptVersionNo: 1, revision, editable: true, scenes: [] }) as Composition;

describe('createCompositionSaver', () => {
  it('coalesces edits and chains revisions, so a second save starts from the first one', async () => {
    const save = vi.fn()
      .mockResolvedValueOnce(saved(1))
      .mockResolvedValueOnce(saved(2));
    const onSaved = vi.fn();
    const saver = createCompositionSaver('p', 0, { onSaved, onError: vi.fn() }, { delayMs: 10_000, save });

    saver.schedule(scenes('a'));
    saver.schedule(scenes('ab'));
    await expect(saver.flush()).resolves.toBe(1);
    saver.schedule(scenes('abc'));
    await saver.flush();

    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[0]).toEqual(['p', 0, scenes('ab')]);
    expect(save.mock.calls[1]).toEqual(['p', 1, scenes('abc')]);
    expect(onSaved).toHaveBeenLastCalledWith(saved(2));
  });

  it('reports a conflict and does not send anything after being disposed', async () => {
    const conflict = Object.assign(new Error('revision 3'), { status: 409 });
    const save = vi.fn().mockRejectedValue(conflict);
    const onError = vi.fn();
    const saver = createCompositionSaver('p', 2, { onSaved: vi.fn(), onError }, { delayMs: 10_000, save });

    saver.schedule(scenes('a'));
    await expect(saver.flush()).rejects.toBe(conflict);
    expect(onError).toHaveBeenCalledWith(conflict);

    saver.dispose();
    saver.schedule(scenes('b'));
    await expect(saver.flush()).rejects.toBe(conflict);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush with nothing pending resolves without saving', async () => {
    const save = vi.fn();
    const saver = createCompositionSaver('p', 0, { onSaved: vi.fn(), onError: vi.fn() }, { save });
    await saver.flush();
    expect(save).not.toHaveBeenCalled();
  });
});
