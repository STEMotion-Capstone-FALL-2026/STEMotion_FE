import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const put = vi.fn();
vi.mock('./apiClient', () => ({ apiClient: { put: (...args: unknown[]) => put(...args) } }));

import { SAVE_DEBOUNCE_MS, sceneSaveQueue } from './sceneSaveQueue';

const scenes = (label: string) => [{ id: 's1', title: label }] as any;

/** Lets queued promise callbacks run between fake-timer steps. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe('sceneSaveQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    put.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('coalesces a burst of edits into one save of the latest scenes', async () => {
    put.mockResolvedValue({});
    for (const label of ['a', 'ab', 'abc', 'abcd']) {
      sceneSaveQueue.schedule('script-1', scenes(label));
      vi.advanceTimersByTime(100);
    }
    expect(put).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    await settle();

    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith('/scripts/script-1', { scenes: scenes('abcd') });
  });

  it('never runs two saves for the same script at once', async () => {
    let release!: () => void;
    put.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)));
    put.mockResolvedValue({});

    const first = sceneSaveQueue.saveNow('script-2', scenes('first'));
    const second = sceneSaveQueue.saveNow('script-2', scenes('second'));
    await settle();
    expect(put).toHaveBeenCalledTimes(1);

    release();
    await first;
    await second;
    expect(put).toHaveBeenCalledTimes(2);
    expect(put.mock.calls[1][1]).toEqual({ scenes: scenes('second') });
  });

  it('drops a pending edit when an immediate save already carries the latest state', async () => {
    put.mockResolvedValue({});
    sceneSaveQueue.schedule('script-3', scenes('stale edit'));
    await sceneSaveQueue.saveNow('script-3', scenes('after add scene'));

    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS * 2);
    await settle();

    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith('/scripts/script-3', { scenes: scenes('after add scene') });
  });

  it('keeps going after a failed save', async () => {
    put.mockRejectedValueOnce(new Error('network')).mockResolvedValue({});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    sceneSaveQueue.schedule('script-4', scenes('one'));
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    await settle();
    sceneSaveQueue.schedule('script-4', scenes('two'));
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    await settle();

    expect(put).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
