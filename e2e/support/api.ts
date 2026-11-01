import { expect, type APIRequestContext } from '@playwright/test';

/** Same defaults as STEMotion_BE E2eServer; fixture-only values, never a real account. */
export const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:18080/api/v1';
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@example.invalid',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'E2e-fixture-only-123',
};
export const INITIAL_PASSWORD = 'E2e-initial-123';
export const CHANGED_PASSWORD = 'E2e-changed-456';

export type SystemRole = 'WRITER' | 'REVIEWER' | 'PRODUCER';

export interface Account {
  id: string;
  fullName: string;
  email: string;
  role: SystemRole;
}

/** Unique per run, so a reused back end never trips over accounts of an earlier run. */
export const runId = () => Date.now().toString(36);

export async function login(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, { data: { email, password } });
  expect(res.status(), `login ${email}`).toBe(200);
  return (await res.json()).accessToken as string;
}

/** Admin provisions an account through the API (FR-03); it must change its password at first login. */
export async function provision(
  request: APIRequestContext,
  adminToken: string,
  fullName: string,
  email: string,
  role: SystemRole,
): Promise<Account> {
  const res = await request.post(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { fullName, email, password: INITIAL_PASSWORD, role },
  });
  expect(res.status(), `provision ${email}`).toBe(201);
  const user = await res.json();
  return { id: user.id, fullName, email, role };
}

export async function provisionTeam(request: APIRequestContext, run: string) {
  const adminToken = await login(request, ADMIN.email, ADMIN.password);
  const team = async (role: SystemRole, name: string) =>
    provision(request, adminToken, `E2E ${name} ${run}`, `e2e-${role.toLowerCase()}-${run}@example.invalid`, role);
  return {
    adminToken,
    writer: await team('WRITER', 'Writer'),
    reviewer: await team('REVIEWER', 'Reviewer'),
    producer: await team('PRODUCER', 'Producer'),
  };
}
