import { expect, type APIRequestContext } from '@playwright/test';

/** Same defaults as STEMotion_BE E2eServer; fixture-only values, never a real account. */
export const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:18080/api/v1';
export const ADMIN = {
  username: process.env.E2E_ADMIN_USERNAME ?? 'e2e-admin',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'E2e-fixture-only-123',
};
export const INITIAL_PASSWORD = 'E2e-initial-123';
export const CHANGED_PASSWORD = 'E2e-changed-456';

export type ProductionRole = 'WRITER' | 'REVIEWER' | 'PRODUCER';

export interface Account {
  id: string;
  fullName: string;
  username: string;
  role: ProductionRole;
}

/** Unique per run, so a reused back end never trips over accounts of an earlier run. */
export const runId = () => Date.now().toString(36);

export async function login(request: APIRequestContext, username: string, password: string): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, { data: { username, password } });
  expect(res.status(), `login ${username}`).toBe(200);
  return (await res.json()).accessToken as string;
}

/** Admin provisions an account through the API (FR-03); it must change its password at first login. */
export async function provision(
  request: APIRequestContext,
  adminToken: string,
  fullName: string,
  username: string,
  role: ProductionRole,
): Promise<Account> {
  const res = await request.post(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { fullName, username, password: INITIAL_PASSWORD, systemRole: 'USER' },
  });
  expect(res.status(), `provision ${username}`).toBe(201);
  const user = await res.json();
  return { id: user.id, fullName, username, role };
}

export async function provisionTeam(request: APIRequestContext, run: string) {
  const adminToken = await login(request, ADMIN.username, ADMIN.password);
  const team = async (role: ProductionRole, name: string) =>
    provision(request, adminToken, `E2E ${name} ${run}`, `e2e-${role.toLowerCase()}-${run}`, role);
  return {
    adminToken,
    writer: await team('WRITER', 'Writer'),
    reviewer: await team('REVIEWER', 'Reviewer'),
    producer: await team('PRODUCER', 'Producer'),
  };
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function changePassword(request: APIRequestContext, token: string, current: string, next: string) {
  const res = await request.post(`${API_URL}/auth/change-password`, {
    headers: bearer(token),
    data: { currentPassword: current, newPassword: next },
  });
  expect(res.ok(), 'change password').toBeTruthy();
}

/**
 * A ready team for WF-02..WF-04: three provisioned accounts that already changed their initial
 * password, seated by the Admin in one workspace (writer is the Leader).
 */
export async function setupWorkspace(request: APIRequestContext, run: string) {
  const team = await provisionTeam(request, run);
  const res = await request.post(`${API_URL}/workspaces`, {
    headers: bearer(team.adminToken),
    data: {
      name: `E2E Workspace ${run}`,
      department: 'Vật Lý',
      leaderUserId: team.writer.id,
      leaderRole: 'WRITER',
      members: [
        { userId: team.reviewer.id, role: 'REVIEWER' },
        { userId: team.producer.id, role: 'PRODUCER' },
      ],
    },
  });
  expect(res.status(), 'create workspace').toBe(201);
  const workspaceId = (await res.json()).id as string;
  const tokens = {} as Record<ProductionRole, string>;
  for (const account of [team.writer, team.reviewer, team.producer]) {
    const first = await login(request, account.username, INITIAL_PASSWORD);
    await changePassword(request, first, INITIAL_PASSWORD, CHANGED_PASSWORD);
    tokens[account.role] = await login(request, account.username, CHANGED_PASSWORD);
  }
  return { ...team, workspaceId, tokens };
}

/** Two 10 s formula scenes: valid props, 20 s in total (the QA lower bound). */
export function formulaScenes(prefix = 'Cảnh') {
  return [1, 2].map((n) => ({
    type: 'MATH_FORMULA',
    title: `${prefix} ${n}`,
    narration: `Đây là lời thoại của ${prefix.toLowerCase()} ${n} về định luật Ôm.`,
    durationInFrames: 300,
    latex: 'I = \frac{U}{R}',
    steps: [{ label: 'Công thức', latexSnippet: 'I = U/R', explanation: 'Dòng điện tỉ lệ với hiệu điện thế.' }],
  }));
}

export async function createProject(request: APIRequestContext, writerToken: string, workspaceId: string, title: string) {
  const res = await request.post(`${API_URL}/workspaces/${workspaceId}/scripts`, {
    headers: bearer(writerToken),
    data: { title, subject: 'Physics', gradeLevel: 'Cơ bản', scenes: formulaScenes() },
  });
  expect(res.status(), `create project ${title}`).toBe(201);
  return (await res.json()).id as string;
}

export async function getProject(request: APIRequestContext, token: string, projectId: string) {
  const res = await request.get(`${API_URL}/scripts/${projectId}`, { headers: bearer(token) });
  expect(res.ok(), 'get project').toBeTruthy();
  return res.json();
}

export async function post(request: APIRequestContext, token: string, path: string, data?: unknown) {
  const res = await request.post(`${API_URL}${path}`, { headers: bearer(token), data: data ?? {} });
  expect(res.ok(), `POST ${path} -> ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.json().catch(() => ({}));
}

/** A project whose script the Reviewer already approved: where WF-03 starts. */
export async function approvedProject(request: APIRequestContext, ws: Awaited<ReturnType<typeof setupWorkspace>>, title: string) {
  const projectId = await createProject(request, ws.tokens.WRITER, ws.workspaceId, title);
  await post(request, ws.tokens.WRITER, `/scripts/${projectId}/submit-review`);
  await post(request, ws.tokens.REVIEWER, `/scripts/${projectId}/approve`, { note: 'E2E: đạt' });
  return projectId;
}
