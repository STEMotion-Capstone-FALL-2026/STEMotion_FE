/**
 * STEMotion Front-End - Clip project service
 *
 * Every call goes to the backend. There is no local cache and no fabricated
 * fallback: if the API fails the error reaches the caller, so the UI can say
 * what went wrong instead of quietly showing data that was never saved.
 */

import { apiClient } from './apiClient';
import { workspaceService } from './workspaceService';
import { STEMScript, STEMSubject, SceneData } from '../types/stem';

export interface CreateProjectPayload {
  title: string;
  subject: STEMSubject;
  gradeLevel: string;
  topicPrompt?: string;
  /** Frames per second for the clip; the backend defaults to 30. */
  fps?: number;
  /** Optional starting scenes, e.g. a draft accepted from the AI assistant. */
  scenes?: SceneData[];
}

export const projectService = {
  /** Scripts of the active workspace, optionally narrowed by subject. */
  async getProjects(filterSubject?: STEMSubject): Promise<STEMScript[]> {
    const workspaceId = await workspaceService.resolveActiveWorkspaceId();
    const list = await apiClient.get<STEMScript[]>(`/workspaces/${workspaceId}/scripts`);
    return filterSubject ? list.filter((p) => p.subject === filterSubject) : list;
  },

  /** One script in full, including its ordered scenes. */
  async getProjectById(id: string): Promise<STEMScript> {
    return apiClient.get<STEMScript>(`/scripts/${id}`);
  },

  async createProject(payload: CreateProjectPayload): Promise<STEMScript> {
    const workspaceId = await workspaceService.resolveActiveWorkspaceId();
    return apiClient.post<STEMScript>(`/workspaces/${workspaceId}/scripts`, {
      title: payload.title,
      subject: payload.subject,
      gradeLevel: payload.gradeLevel,
      fps: payload.fps ?? 30,
      scenes: payload.scenes ?? [],
    });
  },

  async updateProject(id: string, updates: Partial<STEMScript>): Promise<STEMScript> {
    return apiClient.put<STEMScript>(`/scripts/${id}`, updates);
  },

  async deleteProject(id: string): Promise<boolean> {
    await apiClient.delete(`/scripts/${id}`);
    return true;
  },

  /** Hands the draft to the reviewer queue. */
  async submitForReview(id: string): Promise<STEMScript> {
    return apiClient.post<STEMScript>(`/scripts/${id}/submit-review`, {});
  },

  /** Version history, newest first. */
  async getVersions(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/scripts/${id}/versions`);
  },

  /** Two versions side by side, for the diff modal. */
  async diffVersions(id: string, left: string, right: string): Promise<any> {
    return apiClient.get<any>(`/scripts/${id}/diff?left=${left}&right=${right}`);
  },
};
