import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderService } from '../services/renderService';
import { useRenderProgress } from './useRenderProgress';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const tick = () => act(async () => { await Promise.resolve(); });

describe('background render polling', () => {
  it('waits for slow responses, reports queued/processing, and stops after completion', async () => {
    let finish!: (jobs: any[]) => void;
    const load = vi.spyOn(renderService, 'getHistory')
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
      .mockResolvedValueOnce([{ jobId: 'j', status: 'PROCESSING' }])
      .mockResolvedValueOnce([{ jobId: 'j', status: 'COMPLETED', videoUrl: 'https://example.com/v.mp4' }]);
    const completed = vi.fn();
    const { result } = renderHook(() => useRenderProgress('p', true, completed));
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => finish([{ jobId: 'j', status: 'QUEUED' }]));
    expect(result.current.status).toBe('QUEUED');
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(result.current.status).toBe('PROCESSING');
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(completed).toHaveBeenCalledWith('https://example.com/v.mp4');
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('shows connection errors, backs off, and exposes a terminal failure', async () => {
    const load = vi.spyOn(renderService, 'getHistory').mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce([{ jobId: 'j', status: 'FAILED' }]);
    const { result } = renderHook(() => useRenderProgress('p', true, vi.fn()));
    await tick();
    expect(result.current.error).toContain('lỗi kết nối');
    await act(async () => { await vi.advanceTimersByTimeAsync(7999); });
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(result.current.error).toContain('thất bại');
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('ignores completion from a project that is no longer open', async () => {
    let finishOld!: (jobs: any[]) => void;
    vi.spyOn(renderService, 'getHistory')
      .mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
      .mockResolvedValueOnce([{ jobId: 'new', status: 'PROCESSING' }]);
    const completed = vi.fn();
    const { rerender, result } = renderHook(({ id }) => useRenderProgress(id, true, completed), { initialProps: { id: 'old' } });
    rerender({ id: 'new' });
    await tick();
    await act(async () => finishOld([{ jobId: 'old', status: 'COMPLETED', videoUrl: 'https://example.com/old.mp4' }]));
    expect(completed).not.toHaveBeenCalled();
    expect(result.current.status).toBe('PROCESSING');
  });
});
