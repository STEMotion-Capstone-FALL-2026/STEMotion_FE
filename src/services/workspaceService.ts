/**
 * STEMotion Front-End - Workspace Service
 *
 * Scripts live inside a workspace on the backend, so every create/list call
 * needs a workspace id. This service resolves the active one and caches it
 * for the page load. Failures propagate: the studio would rather show an
 * error than operate against a workspace that does not exist.
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

export interface WorkspaceInvitationDto {
  member: WorkspaceMemberDto;
  token: string;
  expiresAt: string;
}

/** Per-page-load cache; cleared on sign-out so the next user starts clean. */
let cachedWorkspaces: WorkspaceSummary[] | null = null;

export const workspaceService = {
  getCachedWorkspaceId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    } catch {
      return null;
    }
  },

  /** Drops the cache, e.g. after signing out or creating a workspace. */
  clearCache(): void {
    cachedWorkspaces = null;
  },

  setActiveWorkspaceId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    } catch (e) {
      console.error('Failed to store active workspace', e);
    }
  },

  /**
   * Cached for the rest of the page load so a screen that asks twice does not
   * cost two round trips.
   */
  async getMyWorkspaces(): Promise<WorkspaceSummary[]> {
    if (cachedWorkspaces) return cachedWorkspaces;
    cachedWorkspaces = await apiClient.get<WorkspaceSummary[]>('/workspaces/mine');
    return cachedWorkspaces;
  },

  /**
   * Returns the workspace to operate in, creating a default one the first time
   * a user signs in so the studio is never blocked on manual setup.
   */
  async resolveActiveWorkspaceId(): Promise<string> {
    const mine = await this.getMyWorkspaces();
    const cached = this.getCachedWorkspaceId();
    if (cached && mine.some((workspace) => workspace.id === cached)) return cached;
    if (mine.length > 0) {
      this.setActiveWorkspaceId(mine[0].id);
      return mine[0].id;
    }

    const created = await apiClient.post<WorkspaceSummary>('/workspaces', {
      name: 'Nhóm STEM của tôi',
      department: 'Chưa phân tổ',
    });
    cachedWorkspaces = null;
    this.setActiveWorkspaceId(created.id);
    return created.id;
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    return apiClient.get<WorkspaceMemberDto[]>(`/workspaces/${workspaceId}/members`);
  },

  /** Creates an inactive seat and returns a one-time link for private delivery. */
  async inviteMember(
    workspaceId: string,
    email: string,
    role: UserRole
  ): Promise<WorkspaceInvitationDto> {
    const member = await apiClient.post<WorkspaceInvitationDto>(
      `/workspaces/${workspaceId}/members`,
      { email, role: role.toUpperCase() }
    );
    cachedWorkspaces = null;
    return member;
  },

  async acceptInvitation(token: string): Promise<WorkspaceMemberDto> {
    const member = await apiClient.post<WorkspaceMemberDto>('/workspace-invitations/accept', { token });
    cachedWorkspaces = null;
    return member;
  },

  async removeMember(workspaceId: string, memberId: string): Promise<boolean> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    cachedWorkspaces = null;
    return true;
  },
};
