/**
 * STEMotion Front-End - Review & QA Service
 * Handles script approval, change requests, and timestamped feedback
 */

import { apiClient } from './apiClient';
import { FeedbackComment } from '../types/stem';
import { projectService } from './projectService';

export const reviewService = {
  async submitReviewDecision(
    projectId: string,
    decision: 'APPROVED' | 'CHANGE_REQUESTED',
    feedbackNote?: string
  ): Promise<{ status: 'APPROVED' | 'CHANGE_REQUESTED'; message: string }> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(200);
      await projectService.updateProject(projectId, { scriptStatus: decision });
      return {
        status: decision,
        message: decision === 'APPROVED' 
          ? 'Kịch bản đã được phê duyệt chính thức!' 
          : 'Đã gửi yêu cầu chỉnh sửa đến đạo diễn sản xuất.',
      };
    }

    return apiClient.post<{ status: 'APPROVED' | 'CHANGE_REQUESTED'; message: string }>(
      `/projects/${projectId}/reviews`,
      { decision, feedbackNote }
    );
  },

  async addComment(
    projectId: string,
    comment: Omit<FeedbackComment, 'id'>
  ): Promise<FeedbackComment> {
    const fullComment: FeedbackComment = {
      id: 'cmt_' + Date.now().toString(36),
      ...comment,
    };

    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(100);
      const project = await projectService.getProjectById(projectId);
      const updatedComments = [...(project.reviewComments || []), fullComment];
      await projectService.updateProject(projectId, { reviewComments: updatedComments });
      return fullComment;
    }

    return apiClient.post<FeedbackComment>(`/projects/${projectId}/comments`, fullComment);
  },

  async resolveComment(projectId: string, commentId: string): Promise<boolean> {
    if (apiClient.isMockMode()) {
      const project = await projectService.getProjectById(projectId);
      const updatedComments = (project.reviewComments || []).map((c: FeedbackComment) =>
        c.id === commentId ? { ...c, status: 'RESOLVED' as const } : c
      );
      await projectService.updateProject(projectId, { reviewComments: updatedComments });
      return true;
    }

    await apiClient.put(`/projects/${projectId}/comments/${commentId}/resolve`);
    return true;
  },
};
