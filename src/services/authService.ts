/**
 * STEMotion Front-End - Authentication Service
 * Manages user session, JWT tokens, and role switching across 5 roles:
 * - Producer, Reviewer, Writer, Admin, Library
 */

import { apiClient } from './apiClient';
import { UserRole } from '../types/stem';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  workspaceId: string;
  workspaceName: string;
}

const USER_STORAGE_KEY = 'stemotion_user_profile';

const DEFAULT_MOCK_USER: UserProfile = {
  id: 'usr_mock_001',
  name: 'Thầy Hoàng Nam (STEM Lead)',
  email: 'hoangnam.stem@edu.vn',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  role: 'producer',
  workspaceId: 'ws_stem_lab_01',
  workspaceName: 'Tổ Chuyên Môn STEM THPT',
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
    return DEFAULT_MOCK_USER;
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
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(200);
      apiClient.setAuthToken('mock_jwt_token_stemotion_' + Date.now());
      const user: UserProfile = {
        ...DEFAULT_MOCK_USER,
        email,
        name: email.split('@')[0].toUpperCase() + ' (STEM)',
      };
      this.setCurrentUser(user);
      return user;
    }

    const response = await apiClient.post<{ token: string; user: UserProfile }>('/auth/login', {
      email,
      password: pass,
    });

    if (response?.token) {
      apiClient.setAuthToken(response.token);
    }
    if (response?.user) {
      this.setCurrentUser(response.user);
      return response.user;
    }
    return this.getCurrentUser();
  },

  logout(): void {
    apiClient.removeAuthToken();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  },
};
