import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { createCompositionSaver, type Composition } from './compositionService';
import { narrationService } from './narrationService';

afterEach(() => vi.restoreAllMocks());

describe('syncing a production composition', () => {
  it('waits for the pending save and sends its new revision to sync', async () => {
    let finishSave!: (saved: Composition) => void;
    const save = vi.fn(() => new Promise<Composition>((resolve) => { finishSave = resolve; }));
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ target: 'COMPOSITION', revision: 4 });
    const saver = createCompositionSaver('p', 2, { onSaved: vi.fn(), onError: vi.fn() }, { delayMs: 10_000, save });
    saver.schedule([{ id: 'scene', durationInFrames: 300 }] as any);

    const syncing = narrationService.syncCompositionDurations('p', saver);
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
    finishSave({ revision: 3 } as Composition);
    await syncing;
    expect(post).toHaveBeenCalledWith('/scripts/p/sync-durations', { baseRevision: 3 });
    saver.dispose();
  });

  it.each([409, 503])('does not sync when autosave fails with %s', async (status) => {
    const error = Object.assign(new Error('Save failed'), { status });
    const post = vi.spyOn(apiClient, 'post');
    const saver = createCompositionSaver('p', 2, { onSaved: vi.fn(), onError: vi.fn() }, {
      delayMs: 10_000, save: vi.fn().mockRejectedValue(error),
    });
    saver.schedule([{ id: 'scene' }] as any);
    await expect(narrationService.syncCompositionDurations('p', saver)).rejects.toBe(error);
    expect(post).not.toHaveBeenCalled();
    saver.dispose();
  });
});
