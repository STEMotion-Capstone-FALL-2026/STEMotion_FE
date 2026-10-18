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

export type QaSeverity = 'PASS' | 'WARN' | 'FAIL';

export type QaCheck =
  | 'DURATION_BOUNDS'
  | 'NARRATION_PACING'
  | 'ON_SCREEN_TEXT_OVERFLOW'
  | 'CONTRAST_READABILITY'
  | 'SCENE_STRUCTURE'
  | 'RENDER_FRESHNESS'
  | 'CAPTION_SYNC';

export interface QaFinding {
  check: QaCheck;
  severity: QaSeverity;
  sceneId?: string | null;
  message: string;
  suggestion?: string | null;
}

export interface QaReport {
  projectId: string;
  passed: boolean;
  failCount: number;
  warnCount: number;
  findings: QaFinding[];
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  totalDurationSeconds: number;
  sceneCount: number;
  scriptStatus: string;
  videoStatus: string;
  ownerName?: string;
  workspaceName?: string;
  updatedAt: string;
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

  async submitVideoForReview(projectId: string): Promise<STEMScript> {
    const updated = await apiClient.post<STEMScript>(`/scripts/${projectId}/submit-video-review`, {});
    return updated;
  },

  async approveVideo(projectId: string): Promise<STEMScript> {
    await apiClient.post(`/scripts/${projectId}/approve-video`, {});
    return projectService.getProjectById(projectId);
  },

  async sendBackVideo(projectId: string, note?: string): Promise<STEMScript> {
    await apiClient.post(`/scripts/${projectId}/send-back`, { note: note || undefined });
    const project = await projectService.getProjectById(projectId);
    if (note) {
      (project as any).videoReviewNote = note;
      (project as any).reviewNote = note;
    }
    return project;
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

  async reopenComment(commentId: string): Promise<boolean> {
    await apiClient.put(`/qa-comments/${commentId}/reopen`, {});
    return true;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    await apiClient.delete(`/qa-comments/${commentId}`);
    return true;
  },

  async getQaReport(projectId: string): Promise<QaReport> {
    return apiClient.get<QaReport>(`/scripts/${projectId}/qa-report`);
  },

  async getReviewQueue(): Promise<ReviewQueueItem[]> {
    const res = await apiClient.get<ReviewQueueItem[]>('/scripts/review-queue');
    return Array.isArray(res) ? res : [];
  },
};

