import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { reviewService } from './reviewService';

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
});
