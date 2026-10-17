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
  myRole?: UserRole;
  isLeader?: boolean;
}

export interface WorkspaceMemberDto {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  isLeader: boolean;
}

export interface CandidateUser {
  id: string;
  fullName: string;
  email: string;
  systemRole: string;
}

const ACTIVE_WORKSPACE_KEY = 'stemotion_active_workspace';

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
  async getMyWorkspaces(forceRefresh = false): Promise<WorkspaceSummary[]> {
    if (forceRefresh) cachedWorkspaces = null;
    if (cachedWorkspaces) return cachedWorkspaces;
    let list: any[] = [];
    try {
      const mine = await apiClient.get<any[]>('/workspaces/mine');
      if (Array.isArray(mine) && mine.length > 0) {
        list = mine;
      }
    } catch {
      // fallback
    }
    // If empty or failed, fallback to /workspaces (for ADMIN or system-level access)
    if (list.length === 0) {
      try {
        const all = await apiClient.get<any[]>('/workspaces');
        if (Array.isArray(all) && all.length > 0) {
          list = all;
        }
      } catch {
        // ignore
      }
    }
    cachedWorkspaces = list.map((w) => this._toWorkspaceSummary(w));
    return cachedWorkspaces;
  },

  async getAllWorkspaces(): Promise<WorkspaceSummary[]> {
    try {
      const all = await apiClient.get<any[]>('/workspaces');
      if (Array.isArray(all) && all.length > 0) {
        return all.map((w) => this._toWorkspaceSummary(w));
      }
    } catch {
      // ignore
    }
    return this.getMyWorkspaces(true);
  },

  /**
   * Returns the workspace to operate in.
   * Never auto-creates a workspace. Returns null if user is not in any workspace.
   */
  async resolveActiveWorkspaceId(): Promise<string | null> {
    const mine = await this.getMyWorkspaces();
    const cached = this.getCachedWorkspaceId();
    if (cached && mine.some((workspace) => workspace.id === cached)) return cached;
    if (mine.length > 0) {
      this.setActiveWorkspaceId(mine[0].id);
      return mine[0].id;
    }
    return null;
  },

  async createWorkspace(data: {
    name: string;
    department?: string;
    leaderUserId: string;
    leaderRole?: string;
  }): Promise<WorkspaceSummary> {
    const created = await apiClient.post<any>('/workspaces', {
      name: data.name,
      department: data.department,
      leaderUserId: data.leaderUserId,
      leaderRole: data.leaderRole ? data.leaderRole.toUpperCase() : 'WRITER',
    });
    cachedWorkspaces = null;
    return this._toWorkspaceSummary(created);
  },

  async getWorkspaceById(id: string): Promise<WorkspaceSummary> {
    const raw = await apiClient.get<any>(`/workspaces/${id}`);
    return this._toWorkspaceSummary(raw);
  },

  async updateWorkspace(
    id: string,
    data: { name: string; department?: string; leaderUserId: string; leaderRole?: string }
  ): Promise<WorkspaceSummary> {
    const updated = await apiClient.put<any>(`/workspaces/${id}`, {
      name: data.name,
      department: data.department,
      leaderUserId: data.leaderUserId,
      leaderRole: data.leaderRole ? data.leaderRole.toUpperCase() : 'WRITER',
    });
    cachedWorkspaces = null;
    return this._toWorkspaceSummary(updated);
  },

  async deleteWorkspace(id: string): Promise<void> {
    await apiClient.delete<void>(`/workspaces/${id}`);
    cachedWorkspaces = null;
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    const rawList = await apiClient.get<any[]>(`/workspaces/${workspaceId}/members`);
    return (rawList || []).map((m) => this._toMemberDto(m));
  },

  async getCandidates(workspaceId: string): Promise<CandidateUser[]> {
    return apiClient.get<CandidateUser[]>(`/workspaces/${workspaceId}/candidates`);
  },

  async addMember(
    workspaceId: string,
    data: { userId: string; role: string; isLeader?: boolean }
  ): Promise<WorkspaceMemberDto> {
    const member = await apiClient.post<any>(`/workspaces/${workspaceId}/members`, {
      userId: data.userId,
      role: data.role.toUpperCase(),
      isLeader: Boolean(data.isLeader),
    });
    cachedWorkspaces = null;
    return this._toMemberDto(member);
  },

  async updateMember(
    workspaceId: string,
    memberId: string,
    data: { role?: string; status?: string; isLeader?: boolean }
  ): Promise<WorkspaceMemberDto> {
    const payload: any = {};
    if (data.role) payload.role = data.role.toUpperCase();
    if (data.status) payload.status = data.status.toUpperCase();
    if (data.isLeader !== undefined) payload.isLeader = data.isLeader;

    const member = await apiClient.patch<any>(`/workspaces/${workspaceId}/members/${memberId}`, payload);
    cachedWorkspaces = null;
    return this._toMemberDto(member);
  },

  async removeMember(workspaceId: string, memberId: string): Promise<boolean> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    cachedWorkspaces = null;
    return true;
  },

  _toMemberDto(raw: any): WorkspaceMemberDto {
    const roleMap: Record<string, UserRole> = {
      WRITER: 'writer',
      REVIEWER: 'reviewer',
      PRODUCER: 'producer',
      ADMIN: 'admin',
    };
    return {
      id: raw.id,
      userId: raw.userId,
      name: raw.name || '',
      email: raw.email || '',
      role: roleMap[raw.role] ?? (raw.role?.toLowerCase() as UserRole) ?? 'writer',
      status: raw.status || 'ACTIVE',
      isLeader: Boolean(raw.isLeader),
    };
  },

  _toWorkspaceSummary(raw: any): WorkspaceSummary {
    const roleMap: Record<string, UserRole> = {
      WRITER: 'writer',
      REVIEWER: 'reviewer',
      PRODUCER: 'producer',
      ADMIN: 'admin',
    };
    return {
      id: raw.id,
      name: raw.name,
      department: raw.department || '',
      membersCount: raw.membersCount ?? 0,
      activeProjects: raw.activeProjects ?? 0,
      myRole: raw.myRole ? (roleMap[raw.myRole] ?? (raw.myRole.toLowerCase() as UserRole)) : undefined,
      isLeader: Boolean(raw.isLeader),
    };
  },
};
