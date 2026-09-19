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
  outputUrl?: string;
  errorMessage?: string;
  resolution: string;
  fps: number;
  createdAt: string;
}

export const renderService = {
  async requestRender(
    projectId: string,
    options: { resolution?: string; fps?: number } = {}
  ): Promise<RenderJobStatus> {
    const resolution = options.resolution || '1080p';
    const fps = options.fps || 60;

    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(300);
      return {
        id: 'render_job_' + Date.now().toString(36),
        projectId,
        status: 'RENDERING',
        progressPercentage: 25,
        resolution,
        fps,
        createdAt: new Date().toISOString(),
      };
    }

    return apiClient.post<RenderJobStatus>('/renders', {
      projectId,
      resolution,
      fps,
    });
  },

  async getRenderStatus(renderId: string): Promise<RenderJobStatus> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(150);
      return {
        id: renderId,
        projectId: 'proj_mock',
        status: 'COMPLETED',
        progressPercentage: 100,
        outputUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        resolution: '1080p',
        fps: 60,
        createdAt: new Date().toISOString(),
      };
    }

    return apiClient.get<RenderJobStatus>(`/renders/${renderId}`);
  },

  async cancelRender(renderId: string): Promise<boolean> {
    if (apiClient.isMockMode()) {
      return true;
    }
    await apiClient.delete(`/renders/${renderId}`);
    return true;
  },
};
