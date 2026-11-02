import { afterEach, expect, it, vi } from 'vitest';
import { adminService } from './adminService';
import { apiClient } from './apiClient';
import { authService } from './authService';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

it('provisions through the admin API without replacing the admin session', async () => {
  apiClient.setAuthToken('admin-token');
  authService.setCurrentUser({ id: 'admin-id', name: 'Admin', email: 'admin@example.invalid', systemRole: 'ADMIN' });
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 'new-id', username: 'teacher' });
  const request = { fullName: 'Teacher', username: 'teacher', password: 'test-password-only', systemRole: 'USER' as const };
  await adminService.provisionUser(request);
  expect(post).toHaveBeenCalledWith('/users', request);
  expect(apiClient.getAuthToken()).toBe('admin-token');
  expect(authService.getCurrentUser().id).toBe('admin-id');
});

it('propagates denied provisioning without reporting success', async () => {
  vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Forbidden'));
  await expect(adminService.provisionUser({ fullName: 'Teacher', username: 'teacher', password: 'test-password-only', systemRole: 'ADMIN' }))
    .rejects.toThrow('Forbidden');
});
