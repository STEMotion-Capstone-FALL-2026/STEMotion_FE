import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from './apiClient';
import { renderService } from './renderService';

describe('render service backend contract', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('maps a queued backend render without inventing a local job', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      jobId: 'job-1', projectId: 'project-1', status: 'PROCESSING', progress: 12,
    });
    const result = await renderService.requestRender('project-1', { fps: 30 });
    expect(post).toHaveBeenCalledWith('/render/projects/project-1/start', {
      resolution: '1080p', fps: 30,
    });
    expect(result).toMatchObject({ id: 'job-1', status: 'RENDERING', progressPercentage: 12 });
  });

  it('surfaces an unavailable worker instead of simulating success', async () => {
    const error = new ApiError('Worker not configured', 'RENDER_NOT_CONFIGURED', 503);
    vi.spyOn(apiClient, 'post').mockRejectedValue(error);
    await expect(renderService.requestRender('project-1')).rejects.toBe(error);
  });

  it('does not replace failed polling with a completed sample video', async () => {
    const error = new ApiError('Network unavailable', 'NETWORK_ERROR', 0);
    vi.spyOn(apiClient, 'get').mockRejectedValue(error);
    await expect(renderService.getRenderStatus('job-1')).rejects.toBe(error);
  });

  it('only confirms cancellation after the backend accepts it', async () => {
    const error = new ApiError('Forbidden', 'FORBIDDEN', 403);
    vi.spyOn(apiClient, 'delete').mockRejectedValue(error);
    await expect(renderService.cancelRender('job-1')).rejects.toBe(error);
  });
});
