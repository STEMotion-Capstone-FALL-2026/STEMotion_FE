/**
 * STEMotion Front-End - Authentication Service
 * Manages user session, JWT tokens, and role switching across 5 roles:
 * - Producer, Reviewer, Writer, Admin, Library
 */

import { apiClient } from './apiClient';
import { workspaceService } from './workspaceService';
import { UserRole } from '../types/stem';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

const USER_STORAGE_KEY = 'stemotion_user_profile';

/**
 * Placeholder used only before the first /auth/me answers. It carries no
 * invented identity: the fields stay blank so a half-loaded header is obvious
 * rather than showing somebody who does not exist.
 */
const EMPTY_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  role: 'writer',
};

export const authService = {
  getCurrentUser(): UserProfile {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse cached user profile', e);
    }
    return EMPTY_USER;
  },

  setCurrentUser(user: UserProfile): void {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to store user profile', e);
    }
  },

  switchRole(newRole: UserRole): UserProfile {
    const current = this.getCurrentUser();
    const updated: UserProfile = { ...current, role: newRole };
    this.setCurrentUser(updated);
    return updated;
  },

  async login(email: string, pass: string): Promise<UserProfile> {
const response = await apiClient.post<any>('/auth/login', {
      email,
      password: pass,
    });

    if (response?.accessToken) {
      apiClient.setAuthToken(response.accessToken);
    }
    if (response?.user) {
      const user = this._toProfile(response.user);
      this.setCurrentUser(user);
      return user;
    }
    return this.getCurrentUser();
  },

  /** Re-reads the signed-in user from the backend, e.g. after a reload. */
  async fetchCurrentUser(): Promise<UserProfile> {
    if (!apiClient.getAuthToken()) {
      return this.getCurrentUser();
    }
    try {
      const me = await apiClient.get<any>('/auth/me');
      const user = this._toProfile(me);
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.warn('[authService] Could not refresh the current user:', error);
      return this.getCurrentUser();
    }
  },

  /** The backend spells roles in upper case; the UI uses capitalised names. */
  _toProfile(raw: any): UserProfile {
    const roleMap: Record<string, UserRole> = {
      WRITER: 'writer',
      REVIEWER: 'reviewer',
      PRODUCER: 'producer',
      ADMIN: 'admin',
    };
    return {
      id: raw?.id ?? '',
      name: raw?.fullName ?? raw?.name ?? '',
      email: raw?.email ?? '',
      role: roleMap[raw?.role] ?? (raw?.role as UserRole) ?? 'writer',
    };
  },

  _toBackendRole(role: UserRole): string {
    return String(role).toUpperCase();
  },

  logout(): void {
    workspaceService.clearCache();
    apiClient.removeAuthToken();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  },
};
