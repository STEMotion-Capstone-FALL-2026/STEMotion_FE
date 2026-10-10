import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { authService } from './authService';

/**
 * The backend spells roles in upper case and returns the token as
 * `accessToken`; both used to be read wrongly, so they are pinned here.
 */
describe('authService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const mockJson = (status: number, payload: unknown) =>
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      text: () => Promise.resolve(JSON.stringify(payload)),
    } as unknown as Response);

  const loginPayload = {
    accessToken: 'jwt-token',
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      fullName: 'Nguyen Van A',
      email: 'writer@stemotion.vn',
      role: 'WRITER',
    },
  };

  it('stores the token returned as accessToken', async () => {
    global.fetch = mockJson(200, loginPayload) as typeof fetch;

    await authService.login('writer@stemotion.vn', 'password123');

    expect(apiClient.getAuthToken()).toBe('jwt-token');
  });

  it('maps the backend role onto the UI spelling', async () => {
    global.fetch = mockJson(200, loginPayload) as typeof fetch;

    const user = await authService.login('writer@stemotion.vn', 'password123');

    expect(user.role).toBe('writer');
  });

  it('maps fullName onto the profile name', async () => {
    global.fetch = mockJson(200, loginPayload) as typeof fetch;

    const user = await authService.login('writer@stemotion.vn', 'password123');

    expect(user.name).toBe('Nguyen Van A');
    expect(user.email).toBe('writer@stemotion.vn');
  });

  it.each([
    ['WRITER', 'writer'],
    ['REVIEWER', 'reviewer'],
    ['PRODUCER', 'producer'],
    ['ADMIN', 'admin'],
  ])('maps %s to %s', async (backendRole, uiRole) => {
    global.fetch = mockJson(200, {
      ...loginPayload,
      user: { ...loginPayload.user, role: backendRole },
    }) as typeof fetch;

    const user = await authService.login('x@stemotion.vn', 'password123');

    expect(user.role).toBe(uiRole);
  });

  it('propagates a rejected login instead of signing the user in', async () => {
    global.fetch = mockJson(400, {
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Invalid email or password',
    }) as typeof fetch;

    await expect(authService.login('writer@stemotion.vn', 'wrong')).rejects.toMatchObject({
      message: 'Invalid email or password',
    });
    expect(apiClient.getAuthToken()).toBeNull();
  });

  it('drops the token on logout', async () => {
    global.fetch = mockJson(200, loginPayload) as typeof fetch;
    await authService.login('writer@stemotion.vn', 'password123');

    authService.logout();

    expect(apiClient.getAuthToken()).toBeNull();
  });

  it('returns the cached user when no token is stored', async () => {
    const user = await authService.fetchCurrentUser();

    expect(user).toBeDefined();
    expect(user.role).toBeDefined();
  });
});
