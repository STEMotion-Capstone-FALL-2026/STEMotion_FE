import { afterEach, expect, it, vi } from 'vitest';
import { adminService } from './adminService';
import { apiClient } from './apiClient';
import { authService } from './authService';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

it('provisions through the admin API without replacing the admin session', async () => {
  apiClient.setAuthToken('admin-token');
  authService.setCurrentUser({ id: 'admin-id', name: 'Admin', email: 'admin@example.invalid', role: 'admin' });
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 'new-id', email: 'teacher@example.invalid' });
  const request = { fullName: 'Teacher', email: 'teacher@example.invalid', password: 'test-password-only', role: 'WRITER' as const };
  await adminService.provisionUser(request);
  expect(post).toHaveBeenCalledWith('/users', request);
  expect(apiClient.getAuthToken()).toBe('admin-token');
  expect(authService.getCurrentUser().id).toBe('admin-id');
});

it('propagates denied provisioning without reporting success', async () => {
  vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Forbidden'));
  await expect(adminService.provisionUser({ fullName: 'Teacher', email: 'teacher@example.invalid', password: 'test-password-only', role: 'ADMIN' }))
    .rejects.toThrow('Forbidden');
});
