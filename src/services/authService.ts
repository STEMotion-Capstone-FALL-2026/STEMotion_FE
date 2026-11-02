import { apiClient, ApiError } from './apiClient';
import { workspaceService } from './workspaceService';
import { SystemRole } from '../types/stem';

export interface UserProfile {
  id: string; name: string; email: string; username?: string | null; avatarUrl?: string;
  accountLabel?: string;
  systemRole: SystemRole; hasLocalPassword?: boolean; googleLinked?: boolean; googleEmail?: string | null;
  authMethod?: 'PASSWORD' | 'GOOGLE'; requiresPasswordChange?: boolean;
}
export interface GoogleChallenge { challengeId: string; nonce: string; challengeSecret: string; expiresInSeconds: number }
export interface GoogleCredential { credential: string; challengeId: string; challengeSecret: string }
export interface ProfileSettings { user: any; session: any; googleLinked: boolean; googleEmail: string | null; googleLoginAllowed: boolean; canLinkGoogle: boolean }
const USER_STORAGE_KEY = 'stemotion_user_profile_v3';
const EMPTY: UserProfile = { id: '', name: '', email: '', systemRole: 'USER', requiresPasswordChange: false };
let generation = 0;

export const authService = {
  generation: () => generation,
  getCurrentUser(): UserProfile {
    try { return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null') || EMPTY; } catch { return EMPTY; }
  },
  setCurrentUser(user: UserProfile): void {
    try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)); }
    catch { console.warn('Không thể lưu bộ nhớ đệm hồ sơ.'); }
  },
  accept(response: any): UserProfile {
    if (!response?.accessToken || !response?.user?.id || !['PASSWORD','GOOGLE'].includes(response?.session?.authMethod)
      || typeof response?.session?.requiresPasswordChange !== 'boolean'
      || !['USER','ADMIN'].includes(response?.user?.systemRole))
      throw new ApiError('Phản hồi đăng nhập không đầy đủ.', 'INVALID_AUTH_RESPONSE');
    const user = this._toProfile(response.user, response.session);
    apiClient.setAuthToken(response.accessToken); this.setCurrentUser(user); return user;
  },
  async login(username: string, password: string): Promise<UserProfile> {
    const request = ++generation;
    const token = apiClient.getAuthToken();
    const r = await apiClient.postPublic('/auth/login', { username: username.trim().toLowerCase(), password });
    if (request !== generation || token !== apiClient.getAuthToken()) throw new Error('Thao tác đăng nhập đã kết thúc.');
    return this.accept(r);
  },
  async googleChallenge(): Promise<GoogleChallenge> { return apiClient.postPublic('/auth/google/challenge'); },
  async loginWithGoogle(body: GoogleCredential, expectedGeneration = generation): Promise<UserProfile> {
    const token = apiClient.getAuthToken();
    const r = await apiClient.postPublic('/auth/google', body);
    if (expectedGeneration !== generation || token !== apiClient.getAuthToken()) throw new Error('Thao tác đăng nhập đã kết thúc.');
    generation++; return this.accept(r);
  },
  async fetchCurrentUser(): Promise<UserProfile> {
    if (!apiClient.getAuthToken()) return EMPTY;
    const expected = generation, token = apiClient.getAuthToken();
    const r = await apiClient.get<any>('/auth/me');
    if (generation !== expected || token !== apiClient.getAuthToken()) throw new Error('Phiên đăng nhập đã thay đổi.');
    if (!r?.user?.id || !r?.session?.authMethod) throw new ApiError('Phản hồi hồ sơ không đầy đủ.', 'INVALID_AUTH_RESPONSE');
    const u = this._toProfile(r.user, r.session); this.setCurrentUser(u); return u;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const expected = generation, token = apiClient.getAuthToken();
    const r = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    if (generation !== expected || token !== apiClient.getAuthToken()) throw new Error('Phiên đăng nhập đã thay đổi.');
    this.accept(r);
  },
  async profile(): Promise<ProfileSettings> {
    const expected = generation, token = apiClient.getAuthToken();
    const result = await apiClient.get<ProfileSettings>('/profile');
    if (generation !== expected || token !== apiClient.getAuthToken()) throw new Error('Phiên đăng nhập đã thay đổi.');
    return result;
  },
  async rename(fullName: string): Promise<ProfileSettings> {
    const expected = generation;
    const r = await apiClient.patch<ProfileSettings>('/profile', { fullName });
    if (expected !== generation) throw new Error('Phiên đăng nhập đã thay đổi.');
    this.setCurrentUser(this._toProfile(r.user, r.session)); return r;
  },
  async linkChallenge(currentPassword: string): Promise<GoogleChallenge> { return apiClient.post('/profile/google/link-challenge', { currentPassword }); },
  async linkGoogle(body: GoogleCredential): Promise<UserProfile> {
    const expected = generation, token = apiClient.getAuthToken();
    const r = await apiClient.post('/profile/google/link', body);
    if (expected !== generation || token !== apiClient.getAuthToken()) throw new Error('Phiên đăng nhập đã thay đổi.');
    return this.accept(r);
  },
  _toProfile(raw: any, session?: any): UserProfile {
    if (!['USER','ADMIN'].includes(raw?.systemRole)) throw new ApiError('Vai trò hệ thống không hợp lệ.', 'INVALID_AUTH_RESPONSE');
    return { id: raw?.id ?? '', name: raw?.fullName ?? raw?.name ?? '', email: raw?.email ?? '',
      accountLabel: raw?.username || raw?.googleEmail || raw?.id || '',
      username: raw?.username, systemRole: raw.systemRole, hasLocalPassword: Boolean(raw?.hasLocalPassword),
      googleLinked: Boolean(raw?.googleLinked), googleEmail: raw?.googleEmail, authMethod: session?.authMethod,
      requiresPasswordChange: Boolean(session?.requiresPasswordChange) };
  },
  logout(): void {
    generation++; workspaceService.clearCache(); apiClient.removeAuthToken();
    try { localStorage.removeItem(USER_STORAGE_KEY); localStorage.removeItem('stemotion_user_profile'); } catch { /* Storage may be unavailable. */ }
    window.google?.accounts?.id?.disableAutoSelect?.();
  },
};
