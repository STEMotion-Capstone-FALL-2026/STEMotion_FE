import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from './apiClient';

/**
 * The client sits between every screen and the backend, so the cases that
 * used to break it in practice are pinned here: empty 204 bodies, the
 * backend's own error shape, and the auth header.
 */
describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const mockResponse = (status: number, body: string) =>
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      text: () => Promise.resolve(body),
    } as unknown as Response);

  it('does not throw on a 204 with an empty body', async () => {
    global.fetch = mockResponse(204, '') as typeof fetch;

    await expect(apiClient.delete('/qa-comments/1')).resolves.toEqual({});
  });

  it('surfaces the backend error message and code', async () => {
    global.fetch = mockResponse(
      400,
      JSON.stringify({ status: 400, code: 'BAD_REQUEST', message: 'Script is DRAFT' })
    ) as typeof fetch;

    await expect(apiClient.get('/scripts/1')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Script is DRAFT',
      status: 400,
    });
  });

  it('wraps a network failure as ApiError rather than leaking it', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('connection refused')) as typeof fetch;

    await expect(apiClient.get('/scripts')).rejects.toBeInstanceOf(ApiError);
  });

  it('sends the bearer token once one is stored', async () => {
    const fetchMock = mockResponse(200, '{"ok":true}');
    global.fetch = fetchMock as typeof fetch;
    apiClient.setAuthToken('token-abc');

    await apiClient.get('/auth/me');

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-abc');
  });

  it('omits the auth header when signed out', async () => {
    const fetchMock = mockResponse(200, '{}');
    global.fetch = fetchMock as typeof fetch;

    await apiClient.get('/library/clips');

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('points at the backend base URL, not a mock', () => {
    expect(apiClient.getBaseUrl()).toContain('/api/v1');
  });

  it('builds the URL against the configured base', async () => {
    const fetchMock = mockResponse(200, '{}');
    global.fetch = fetchMock as typeof fetch;

    await apiClient.get('/workspaces/mine');

    expect(fetchMock.mock.calls[0][0]).toBe(`${apiClient.getBaseUrl()}/workspaces/mine`);
  });

  it('accepts a path with no leading slash', async () => {
    const fetchMock = mockResponse(200, '{}');
    global.fetch = fetchMock as typeof fetch;

    await apiClient.get('workspaces/mine');

    expect(fetchMock.mock.calls[0][0]).toBe(`${apiClient.getBaseUrl()}/workspaces/mine`);
  });

  it('issues a PATCH with a JSON body', async () => {
    const fetchMock = mockResponse(200, '{}');
    global.fetch = fetchMock as typeof fetch;

    await apiClient.patch('/users/1', { role: 'ADMIN' });

    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
    expect(fetchMock.mock.calls[0][1].body).toBe('{"role":"ADMIN"}');
  });

  it('clears the stored token on sign-out', () => {
    apiClient.setAuthToken('token-abc');
    apiClient.removeAuthToken();

    expect(apiClient.getAuthToken()).toBeNull();
  });
});
