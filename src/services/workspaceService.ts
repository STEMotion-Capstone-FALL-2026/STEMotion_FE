/**
 * STEMotion Front-End - Workspace Service
 *
 * Scripts live inside a workspace on the backend, so every create/list call
 * needs a workspace id. This service resolves and caches the active one.
 */

import { apiClient } from './apiClient';
import { UserRole } from '../types/stem';

export interface WorkspaceSummary {
  id: string;
  name: string;
  department?: string;
  membersCount: number;
  activeProjects: number;
}

export interface WorkspaceMemberDto {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED';
}

const ACTIVE_WORKSPACE_KEY = 'stemotion_active_workspace';

const MOCK_WORKSPACE: WorkspaceSummary = {
  id: 'ws_mock_001',
  name: 'Nhóm STEM THCS Tân Bình',
  department: 'Tổ Toán - Lý',
  membersCount: 4,
  activeProjects: 3,
};

export const workspaceService = {
  getCachedWorkspaceId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    } catch {
      return null;
    }
  },

  setActiveWorkspaceId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    } catch (e) {
      console.error('Failed to store active workspace', e);
    }
  },

  async getMyWorkspaces(): Promise<WorkspaceSummary[]> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(120);
      return [MOCK_WORKSPACE];
    }

    try {
      return await apiClient.get<WorkspaceSummary[]>('/workspaces/mine');
    } catch (error) {
      console.warn('[workspaceService] Backend unreachable, using mock workspace:', error);
      return [MOCK_WORKSPACE];
    }
  },

  /**
   * Returns the workspace to operate in, creating a default one the first time
   * a user signs in so the studio is never blocked on manual setup.
   */
  async resolveActiveWorkspaceId(): Promise<string> {
    const cached = this.getCachedWorkspaceId();
    if (cached) return cached;

    if (apiClient.isMockMode()) {
      this.setActiveWorkspaceId(MOCK_WORKSPACE.id);
      return MOCK_WORKSPACE.id;
    }

    try {
      const mine = await apiClient.get<WorkspaceSummary[]>('/workspaces/mine');
      if (mine.length > 0) {
        this.setActiveWorkspaceId(mine[0].id);
        return mine[0].id;
      }
      const created = await apiClient.post<WorkspaceSummary>('/workspaces', {
        name: 'Nhóm STEM của tôi',
        department: 'Chưa phân tổ',
      });
      this.setActiveWorkspaceId(created.id);
      return created.id;
    } catch (error) {
      console.warn('[workspaceService] Could not resolve a workspace, using mock id:', error);
      return MOCK_WORKSPACE.id;
    }
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(120);
      return [];
    }

    try {
      return await apiClient.get<WorkspaceMemberDto[]>(`/workspaces/${workspaceId}/members`);
    } catch (error) {
      console.warn('[workspaceService] Backend unreachable, no members returned:', error);
      return [];
    }
  },

  async inviteMember(
    workspaceId: string,
    email: string,
    role: UserRole
  ): Promise<WorkspaceMemberDto> {
    const optimistic: WorkspaceMemberDto = {
      id: 'mem_' + Date.now().toString(36),
      name: email,
      email,
      role,
      status: 'INVITED',
    };

    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(150);
      return optimistic;
    }

    try {
      return await apiClient.post<WorkspaceMemberDto>(
        `/workspaces/${workspaceId}/members`,
        { email, role }
      );
    } catch (error) {
      console.warn('[workspaceService] Backend unreachable, invitation kept locally:', error);
      return optimistic;
    }
  },

  async removeMember(workspaceId: string, memberId: string): Promise<boolean> {
    if (apiClient.isMockMode()) return true;

    try {
      await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    } catch (error) {
      console.warn('[workspaceService] Backend unreachable, member removed locally:', error);
    }
    return true;
  },
};
