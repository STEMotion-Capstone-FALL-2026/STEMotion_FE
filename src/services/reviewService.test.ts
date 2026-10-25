import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { reviewService } from './reviewService';
import { createCompositionSaver, type Composition } from './compositionService';

describe('server-confirmed review workflow', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('does not turn a rejected decision into an approved script', async () => {
    const error = new Error('Forbidden');
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue(error);
    const put = vi.spyOn(apiClient, 'put');
    await expect(reviewService.submitReviewDecision('project', 'APPROVED')).rejects.toBe(error);
    expect(post).toHaveBeenCalledWith('/scripts/project/approve', { note: undefined });
    expect(put).not.toHaveBeenCalled();
  });

  it('approves the rendered video through its separate QA endpoint', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    vi.spyOn(apiClient, 'get').mockResolvedValue({ id: 'project', videoStatus: 'APPROVED' });
    await expect(reviewService.approveVideo('project')).resolves.toMatchObject({ videoStatus: 'APPROVED' });
    expect(post).toHaveBeenCalledWith('/scripts/project/approve-video', {});
  });

  it('does not manufacture comments, empty lists or successful resolution on failure', async () => {
    const error = new Error('Network unavailable');
    vi.spyOn(apiClient, 'get').mockRejectedValue(error);
    vi.spyOn(apiClient, 'post').mockRejectedValue(error);
    vi.spyOn(apiClient, 'put').mockRejectedValue(error);
    await expect(reviewService.getComments('project')).rejects.toBe(error);
    await expect(reviewService.resolveComment('project', 'comment')).rejects.toBe(error);
    await expect(reviewService.addComment('project', {
      author: 'Reviewer', avatar: 'R', role: 'Reviewer', timestampSec: 2,
      content: 'Fix this', status: 'OPEN', createdAt: new Date().toISOString(),
    })).rejects.toBe(error);
  });

  it('sends a scene target without also claiming a video timestamp', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 'saved', role: 'REVIEWER' });
    await reviewService.addComment('project', {
      author: 'Reviewer', avatar: 'R', role: 'Reviewer', timestampSec: 2, sceneId: 'scene',
      content: 'Fix this', status: 'OPEN', createdAt: new Date().toISOString(),
    });
    expect(post).toHaveBeenCalledWith('/scripts/project/qa-comments', {
      timestampSec: null, sceneId: 'scene', content: 'Fix this',
    });
  });

  it('saves pending composition edits before submitting them for review', async () => {
    let finish!: (saved: Composition) => void;
    const save = vi.fn(() => new Promise<Composition>(resolve => { finish = resolve; }));
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 'p', videoStatus: 'IN_QA' });
    const saver = createCompositionSaver('p', 1, { onSaved: vi.fn(), onError: vi.fn() }, { save, delayMs: 10000 });
    saver.schedule([{ id: 's', title: 'Last edit' }] as any);
    const submitted = reviewService.submitSavedVideoForReview('p', saver, () => true);
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
    finish({ projectId: 'p', revision: 2 } as Composition);
    await expect(submitted).resolves.toMatchObject({ videoStatus: 'IN_QA' });
    expect(post).toHaveBeenCalledWith('/scripts/p/submit-video-review', {});
    saver.dispose();
  });

  it('preserves the resolver identity and timestamp returned by the server', async () => {
    vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 'c', role: 'WRITER', status: 'RESOLVED',
      resolvedByName: 'Nguyen An', resolvedAt: '2026-10-23T10:00:00Z' });
    await expect(reviewService.resolveComment('p', 'c')).resolves.toMatchObject({ id: 'c', status: 'RESOLVED',
      resolvedByName: 'Nguyen An', resolvedAt: '2026-10-23T10:00:00Z' });
  });

  it('does not submit after a save failure or after changing projects while saving', async () => {
    const post = vi.spyOn(apiClient, 'post');
    const failed = { flush: vi.fn().mockRejectedValue(new Error('Save failed')), schedule: vi.fn(), dispose: vi.fn() };
    await expect(reviewService.submitSavedVideoForReview('p', failed, () => true)).rejects.toThrow('Save failed');
    const old = { ...failed, flush: vi.fn().mockResolvedValue(2) };
    await expect(reviewService.submitSavedVideoForReview('p', old, () => false)).resolves.toBeNull();
    expect(post).not.toHaveBeenCalled();
  });
});
