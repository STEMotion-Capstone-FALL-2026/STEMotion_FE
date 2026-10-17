/**
 * STEMotion Front-End - Video Render Service
 * Manages video export jobs, status polling, and MP4 download URLs
 */

import { apiClient } from './apiClient';

export interface RenderJobStatus {
  id: string;
  projectId: string;
  status: 'QUEUED' | 'RENDERING' | 'COMPLETED' | 'FAILED';
  progressPercentage: number;
  stage?: string;
  outputUrl?: string;
  errorMessage?: string;
  resolution: string;
  fps: number;
  createdAt: string;
}

/** One past render of a project, as listed by the render history. */
export interface RenderHistoryEntry {
  jobId: string;
  status: string;
  videoUrl?: string | null;
  createdAt?: string;
  scriptVersionNo?: number | null;
}

export const renderService = {
  /** Every render of the project, newest first; used to compare re-rendered clips. */
  async getHistory(projectId: string): Promise<RenderHistoryEntry[]> {
    const jobs = await apiClient.get<RenderHistoryEntry[]>(`/render/projects/${projectId}/jobs`);
    return Array.isArray(jobs) ? jobs : [];
  },

  /** Maps the backend RenderJobResponse onto the shape the UI renders. */
  _toRenderJobStatus(job: any, resolution = '1080p', fps = 30): RenderJobStatus {
    return {
      id: job.jobId ?? job.id,
      projectId: job.projectId,
      // The backend calls the in-flight state PROCESSING; the UI says RENDERING.
      status: job.status === 'PROCESSING' ? 'RENDERING' : job.status,
      progressPercentage: job.progress ?? 0,
      stage: job.stage,
      outputUrl: job.videoUrl ?? undefined,
      errorMessage: job.errorMessage ?? undefined,
      resolution,
      fps,
      createdAt: job.createdAt ?? new Date().toISOString(),
    };
  },

  async requestRender(
    projectId: string,
    options: { resolution?: string; fps?: number } = {}
  ): Promise<RenderJobStatus> {
    const resolution = options.resolution || '1080p';
    const fps = options.fps || 30;

    const job = await apiClient.post<any>(`/render/projects/${projectId}/start`, {
      resolution,
      fps,
    });
    return this._toRenderJobStatus(job, resolution, fps);
  },

  async getRenderStatus(renderId: string): Promise<RenderJobStatus> {
    const job = await apiClient.get<any>(`/render/status/${renderId}`);
    return this._toRenderJobStatus(job);
  },

  async cancelRender(renderId: string): Promise<boolean> {
    await apiClient.delete(`/render/jobs/${renderId}`);
    return true;
  },

  /** Retries a failed or timed-out render job */
  async retryRender(jobId: string): Promise<RenderJobStatus> {
    const job = await apiClient.post<any>(`/render/jobs/${jobId}/retry`);
    return this._toRenderJobStatus(job);
  },
};
