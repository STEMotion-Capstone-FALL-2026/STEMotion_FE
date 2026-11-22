import { apiClient } from './apiClient';

/**
 * Collaboration API (UC-29 to UC-34): project proposals, project roles and join requests,
 * edit leases, contributions, the Leader dashboard and the Admin AI/TTS settings.
 */
export type ProjectRole = 'WRITER' | 'REVIEWER' | 'PRODUCER';
export type LeaseType = 'script-draft' | 'composition';

export interface Proposal {
  id: string;
  workspaceId: string;
  proposerId: string;
  proposerName?: string | null;
  title: string;
  subject: string;
  gradeLevel?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionReason?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  projectId?: string | null;
  createdAt?: string | null;
}

export interface JoinRequest {
  id: string;
  projectId: string;
  projectTitle?: string | null;
  userId: string;
  userName?: string | null;
  role: ProjectRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  reason?: string | null;
  createdAt?: string | null;
}

export interface ProjectMember {
  userId: string;
  name?: string | null;
  role: ProjectRole;
  status: 'ACTIVE' | 'REVOKED';
  revokedAt?: string | null;
  joinedAt?: string | null;
}

export interface ProjectTeam {
  projectId: string;
  usesProjectRoles: boolean;
  members: ProjectMember[];
  missingRoles: string[];
}

export interface Lease {
  resourceType: string;
  projectId: string;
  holderId?: string | null;
  holderName?: string | null;
  acquiredAt?: string | null;
  expiresAt?: string | null;
  held: boolean;
  mine: boolean;
  required: boolean;
}

export interface Contribution {
  id: string;
  actorId: string;
  actorName?: string | null;
  projectRole: string;
  eventType: string;
  targetId?: string | null;
  occurredAt: string;
}

export interface Contributions {
  projectId: string;
  byMember: { actorId: string; actorName?: string | null; total: number; byType: Record<string, number> }[];
  events: Contribution[];
}

export interface BoardCard {
  projectId: string;
  title: string;
  workspaceId: string;
  stage: string;
  ownerId: string;
  ownerName?: string | null;
  blockers: string[];
}

export interface LeaderDashboard {
  pendingProposals: Proposal[];
  pendingJoinRequests: JoinRequest[];
  board: Record<string, BoardCard[]>;
}

export interface AiSettings {
  allowedAiProviders: string[];
  allowedModels: string[];
  allowedVoices: string[];
  monthlyBudgetUsd: number;
  perClipCapUsd: number;
  revision: number;
  updatedBy?: string | null;
  updatedAt?: string | null;
  spentThisMonthUsd: number;
}

const enc = encodeURIComponent;

export const collabService = {
  propose(workspaceId: string, body: { title: string; subject: string; gradeLevel?: string | null }): Promise<Proposal> {
    return apiClient.post<Proposal>(`/workspaces/${enc(workspaceId)}/proposals`, body);
  },
  proposals(workspaceId: string): Promise<Proposal[]> {
    return apiClient.get<Proposal[]>(`/workspaces/${enc(workspaceId)}/proposals`);
  },
  approveProposal(id: string): Promise<Proposal> {
    return apiClient.post<Proposal>(`/proposals/${enc(id)}/approve`);
  },
  rejectProposal(id: string, reason: string): Promise<Proposal> {
    return apiClient.post<Proposal>(`/proposals/${enc(id)}/reject`, { reason });
  },

  team(projectId: string): Promise<ProjectTeam> {
    return apiClient.get<ProjectTeam>(`/projects/${enc(projectId)}/team`);
  },
  requestJoin(projectId: string, role: ProjectRole): Promise<JoinRequest> {
    return apiClient.post<JoinRequest>(`/projects/${enc(projectId)}/join-requests`, { role });
  },
  joinRequests(projectId: string): Promise<JoinRequest[]> {
    return apiClient.get<JoinRequest[]>(`/projects/${enc(projectId)}/join-requests`);
  },
  approveJoin(id: string): Promise<JoinRequest> {
    return apiClient.post<JoinRequest>(`/join-requests/${enc(id)}/approve`);
  },
  rejectJoin(id: string, reason?: string): Promise<JoinRequest> {
    return apiClient.post<JoinRequest>(`/join-requests/${enc(id)}/reject`, { reason: reason ?? null });
  },
  revoke(projectId: string, userId: string): Promise<ProjectTeam> {
    return apiClient.delete<ProjectTeam>(`/projects/${enc(projectId)}/members/${enc(userId)}`);
  },

  lease(projectId: string, type: LeaseType): Promise<Lease> {
    return apiClient.get<Lease>(`/projects/${enc(projectId)}/leases/${type}`);
  },
  acquireLease(projectId: string, type: LeaseType): Promise<Lease> {
    return apiClient.post<Lease>(`/projects/${enc(projectId)}/leases/${type}`);
  },
  releaseLease(projectId: string, type: LeaseType, force = false): Promise<Lease> {
    return apiClient.delete<Lease>(`/projects/${enc(projectId)}/leases/${type}${force ? '?force=true' : ''}`);
  },

  contributions(projectId: string): Promise<Contributions> {
    return apiClient.get<Contributions>(`/projects/${enc(projectId)}/contributions`);
  },
  leaderDashboard(): Promise<LeaderDashboard> {
    return apiClient.get<LeaderDashboard>('/leader/dashboard');
  },

  aiSettings(): Promise<AiSettings> {
    return apiClient.get<AiSettings>('/admin/ai-settings');
  },
  saveAiSettings(body: Omit<AiSettings, 'revision' | 'updatedBy' | 'updatedAt' | 'spentThisMonthUsd'> & { baseRevision: number }): Promise<AiSettings> {
    return apiClient.put<AiSettings>('/admin/ai-settings', body);
  },
};

export const ROLE_LABELS: Record<string, string> = {
  WRITER: 'Biên kịch',
  REVIEWER: 'Thẩm định',
  PRODUCER: 'Dựng video',
  ADMIN: 'Quản trị',
  MEMBER: 'Thành viên',
};

export const CONTRIBUTION_LABELS: Record<string, string> = {
  SCRIPT_SUBMITTED: 'Nộp kịch bản',
  COMPOSITION_REVISED: 'Sửa bản dựng',
  REVIEW_DECIDED: 'Quyết định duyệt',
  NOTE_RESOLVED: 'Giải quyết ghi chú',
  PUBLISHED: 'Xuất bản',
};

export function blockerLabel(code: string): string {
  if (code.startsWith('OPEN_NOTES:')) return `${code.split(':')[1]} ghi chú chưa xử lý`;
  if (code.startsWith('MISSING_ROLE:')) return `Thiếu ${ROLE_LABELS[code.split(':')[1]] ?? code.split(':')[1]}`;
  if (code === 'RENDER_FAILED') return 'Render lỗi';
  return code;
}
