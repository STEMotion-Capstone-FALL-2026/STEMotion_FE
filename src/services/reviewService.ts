import { apiClient } from './apiClient';
import { FeedbackComment, STEMScript } from '../types/stem';
import { projectService } from './projectService';

function toComment(c: any): FeedbackComment {
  return {
    id: c.id, author: c.author, avatar: c.avatar,
    role: (c.role?.charAt(0) + c.role?.slice(1).toLowerCase()) as FeedbackComment['role'],
    timestampSec: c.timestampSec ?? 0, sceneId: c.sceneId ?? undefined,
    content: c.content, status: c.status, createdAt: c.createdAt,
  };
}

/** Only server-confirmed decisions and comments are reflected in the studio. */
export const reviewService = {
  async getComments(projectId: string): Promise<FeedbackComment[]> {
    return (await apiClient.get<any[]>(`/scripts/${projectId}/qa-comments`)).map(toComment);
  },

  async submitReviewDecision(projectId: string, decision: 'APPROVED' | 'CHANGE_REQUESTED',
    feedbackNote?: string): Promise<STEMScript> {
    const path = decision === 'APPROVED' ? 'approve' : 'request-changes';
    return apiClient.post<STEMScript>(`/scripts/${projectId}/${path}`, { note: feedbackNote });
  },

  async approveVideo(projectId: string): Promise<STEMScript> {
    await apiClient.post(`/scripts/${projectId}/approve-video`, {});
    return projectService.getProjectById(projectId);
  },

  async sendBackVideo(projectId: string): Promise<STEMScript> {
    await apiClient.post(`/scripts/${projectId}/send-back`, {});
    return projectService.getProjectById(projectId);
  },

  async addComment(projectId: string, comment: Omit<FeedbackComment, 'id'>): Promise<FeedbackComment> {
    const saved = await apiClient.post<any>(`/scripts/${projectId}/qa-comments`, {
      timestampSec: comment.sceneId ? null : comment.timestampSec,
      sceneId: comment.sceneId, content: comment.content,
    });
    return toComment(saved);
  },

  async resolveComment(_projectId: string, commentId: string): Promise<boolean> {
    await apiClient.put(`/qa-comments/${commentId}/resolve`, {});
    return true;
  },
};
