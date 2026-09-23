/**
 * STEMotion Front-End - Review & QA Service
 * Handles script approval, change requests, and timestamped feedback
 */

import { apiClient } from './apiClient';
import { FeedbackComment } from '../types/stem';
import { projectService } from './projectService';

export const reviewService = {
  /** Review notes pinned to a clip, in timecode order. */
  async getComments(projectId: string): Promise<FeedbackComment[]> {
try {
      const raw = await apiClient.get<any[]>(`/scripts/${projectId}/qa-comments`);
      return raw.map((c) => ({
        id: c.id,
        author: c.author,
        avatar: c.avatar,
        // The API spells roles in upper case; FeedbackComment uses title case.
        role: (c.role?.charAt(0) + c.role?.slice(1).toLowerCase()) as FeedbackComment['role'],
        timestampSec: c.timestampSec ?? 0,
        sceneId: c.sceneId ?? undefined,
        content: c.content,
        status: c.status,
        createdAt: c.createdAt,
      }));
    } catch (error) {
      console.warn('[reviewService] Backend unreachable, no comments loaded:', error);
      return [];
    }
  },

  async submitReviewDecision(
    projectId: string,
    decision: 'APPROVED' | 'CHANGE_REQUESTED',
    feedbackNote?: string
  ): Promise<{ status: 'APPROVED' | 'CHANGE_REQUESTED'; message: string }> {
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

try {
      await apiClient.put(`/qa-comments/${commentId}/resolve`, {});
    } catch (error) {
      console.warn('[reviewService] Backend unreachable, resolved locally:', error);
    }
    return true;
  },
};
