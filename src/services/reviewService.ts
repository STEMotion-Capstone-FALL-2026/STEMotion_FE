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

    try {
      // The backend exposes the two decisions as separate transitions.
      const path = decision === 'APPROVED' ? 'approve' : 'request-changes';
      const updated = await apiClient.post<{ scriptStatus: string }>(
        `/scripts/${projectId}/${path}`,
        { note: feedbackNote }
      );
      return {
        status: (updated.scriptStatus as 'APPROVED' | 'CHANGE_REQUESTED') ?? decision,
        message: decision === 'APPROVED'
          ? 'Kịch bản đã được phê duyệt chính thức!'
          : 'Đã gửi yêu cầu chỉnh sửa đến đạo diễn sản xuất.',
      };
    } catch (error) {
      console.warn('[reviewService] Backend unreachable, fallback to local decision:', error);
      await projectService.updateProject(projectId, { scriptStatus: decision });
      return {
        status: decision,
        message: decision === 'APPROVED' 
          ? 'Kịch bản đã được phê duyệt chính thức!' 
          : 'Đã gửi yêu cầu chỉnh sửa đến đạo diễn sản xuất.',
      };
    }
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

    try {
      const saved = await apiClient.post<any>(`/scripts/${projectId}/qa-comments`, {
        timestampSec: comment.timestampSec,
        sceneId: comment.sceneId,
        content: comment.content,
      });
      return { ...fullComment, id: saved.id, author: saved.author, status: saved.status };
    } catch (error) {
      console.warn('[reviewService] Backend unreachable, saving comment locally:', error);
      const project = await projectService.getProjectById(projectId);
      const updatedComments = [...(project.reviewComments || []), fullComment];
      await projectService.updateProject(projectId, { reviewComments: updatedComments });
      return fullComment;
    }
  },

  async resolveComment(projectId: string, commentId: string): Promise<boolean> {
    const project = await projectService.getProjectById(projectId);
    const updatedComments = (project.reviewComments || []).map((c: FeedbackComment) =>
      c.id === commentId ? { ...c, status: 'RESOLVED' as const } : c
    );
    await projectService.updateProject(projectId, { reviewComments: updatedComments });

    if (apiClient.isMockMode()) {
      return true;
    }

    try {
      await apiClient.put(`/qa-comments/${commentId}/resolve`, {});
    } catch (error) {
      console.warn('[reviewService] Backend unreachable, resolved locally:', error);
    }
    return true;
  },
};
