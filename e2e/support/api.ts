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

/** Seeded STEM demo-pack.v1 IDs from STEMotion_BE E2eServer (when E2E_STEM=1). */
export const STEM_PRIMARY_POLICY_ID = '00000000-0000-0000-0000-000000000005';
export const STEM_PRIMARY_RUBRIC_ID = '00000000-0000-0000-0000-000000000004';
export const STEM_PRIMARY_MATH_OUTCOME_ID = '00000000-0000-0000-0000-000000000003';
export const STEM_PRIMARY_SCI_OUTCOME_ID = '00000000-0000-0000-0000-000000000013';
export const STEM_PRIMARY_TOPIC_VERSION_ID = '00000000-0000-0000-0000-000000000018';

/** Admin switches a workspace to STRICT (or ADVISORY/OFF) and pins the primary STEM policy. */
export async function setWorkspaceStemMode(
  request: APIRequestContext,
  adminToken: string,
  workspaceId: string,
  mode: 'OFF' | 'ADVISORY' | 'STRICT',
  policyId: string = STEM_PRIMARY_POLICY_ID,
) {
  const currentRes = await request.get(`${API_URL}/workspaces/${workspaceId}/stem-settings`, {
    headers: bearer(adminToken),
  });
  expect(currentRes.ok(), `GET stem-settings for ${workspaceId}`).toBeTruthy();
  const current = await currentRes.json();
  const baseRevision = current.revision ?? current.modeRevision ?? 0;

  const updateRes = await request.put(`${API_URL}/workspaces/${workspaceId}/stem-settings`, {
    headers: bearer(adminToken),
    data: {
      baseRevision,
      mode,
      policyVersionIds: [policyId],
      defaultPolicyVersionId: policyId,
      idempotencyKey: `e2e-mode-${mode.toLowerCase()}-${workspaceId}-${baseRevision}-${Date.now()}`,
    },
  });
  expect(updateRes.ok(), `PUT stem-settings ${mode} -> ${updateRes.status()} ${await updateRes.text()}`).toBeTruthy();
  return updateRes.json();
}

/** Creates and saves a complete, valid 6-step STEM brief for the current script version of a project. */
export async function seedStemBrief(
  request: APIRequestContext,
  writerToken: string,
  projectId: string,
  policyId: string = STEM_PRIMARY_POLICY_ID,
) {
  const project = await getProject(request, writerToken, projectId);
  const versionsRes = await request.get(`${API_URL}/scripts/${projectId}/versions`, {
    headers: bearer(writerToken),
  });
  expect(versionsRes.ok(), 'get versions').toBeTruthy();
  const versions = await versionsRes.json();
  const currentVersion =
    versions.find((v: any) => v.versionNo === (project.currentVersionNo ?? 1)) ?? versions[0];
  expect(currentVersion?.id, 'current version UUID').toBeTruthy();
  const versionId = currentVersion.id as string;
  const expectedScriptRevision = project.draftRevision ?? currentVersion.draftRevision ?? 0;

  const sceneIds: string[] = (project.scenes ?? []).map((s: any) => s.id).filter(Boolean);
  const firstSceneId = sceneIds[0];
  const lastSceneId = sceneIds[sceneIds.length - 1] ?? firstSceneId;

  const getViewRes = await request.get(`${API_URL}/scripts/${projectId}/versions/${versionId}/stem`, {
    headers: bearer(writerToken),
  });
  expect(getViewRes.ok(), 'GET stem brief view').toBeTruthy();
  let view = await getViewRes.json();

  if (!view.briefId) {
    const createRes = await request.post(`${API_URL}/scripts/${projectId}/versions/${versionId}/stem`, {
      headers: bearer(writerToken),
      data: {
        schemaVersion: 'stem.v1',
        expectedScriptRevision,
        idempotencyKey: `e2e-create-brief-${versionId}-${Date.now()}`,
      },
    });
    expect(createRes.ok(), `POST create stem brief -> ${createRes.status()}`).toBeTruthy();
    view = await createRes.json();
  }

  const briefPayload = {
    schemaVersion: 'stem.v1',
    baseRevision: view.revision ?? 0,
    expectedScriptRevision,
    idempotencyKey: `e2e-save-brief-${versionId}-${view.revision ?? 0}-${Date.now()}`,
    brief: {
      topicVersionId: null,
      policyVersionId: policyId,
      gradeKey: 'GRADE_4',
      subjectKeys: ['Math', 'Science'],
      outcomeIds: [STEM_PRIMARY_MATH_OUTCOME_ID, STEM_PRIMARY_SCI_OUTCOME_ID],
      rawLegacy: null,
      context: {
        primary: {
          key: 'IN_CLASS_SCREEN',
          condition: 'Chiếu chung trên màn hình lớp học kết hợp thảo luận nhóm (TEST_ONLY)',
        },
        secondary: [],
      },
      distributionChannels: ['DEPARTMENT_LIBRARY'],
      objectives: [
        {
          key: 'obj-1',
          outcomeId: STEM_PRIMARY_MATH_OUTCOME_ID,
          learnerAction: 'Đo và ghi nhận thể tích nước lọc được bằng cốc chia vạch (TEST_ONLY)',
          observableEvidence: 'Bảng ghi số liệu đo thể tích của nhóm (TEST_ONLY)',
        },
        {
          key: 'obj-2',
          outcomeId: STEM_PRIMARY_SCI_OUTCOME_ID,
          learnerAction: 'Quan sát độ trong của nước qua từng lớp vật liệu lọc (TEST_ONLY)',
          observableEvidence: 'Phiếu so sánh mẫu nước trước và sau khi lọc (TEST_ONLY)',
        },
      ],
      studentTasks: [
        {
          key: 'task-1',
          learnerAction: 'Thiết kế, lắp ghép mô hình bình lọc nước mini và đo thể tích nước (TEST_ONLY)',
          teacherSupport: 'Hướng dẫn thứ tự sắp xếp sỏi, cát sạch và bông gòn (TEST_ONLY)',
          materials: 'Vỏ chai nhựa, sỏi, cát sạch, bông gòn, cốc đong chia vạch (TEST_ONLY)',
          safety: 'Không uống nước sau lọc; rửa tay sạch bằng xà phòng sau thí nghiệm (TEST_ONLY)',
          assessmentEvidence: 'Mô hình bình lọc hoàn chỉnh và phiếu kết quả đo (TEST_ONLY)',
          executionContextKey: 'IN_CLASS_SCREEN',
        },
      ],
      contributions: [
        {
          component: 'S',
          explanation: 'Khám phá tính chất giữ cặn của các lớp vật liệu tự nhiên (TEST_ONLY)',
          objectiveKeys: ['obj-2'],
          taskKeys: ['task-1'],
        },
        {
          component: 'T',
          explanation: 'Sử dụng video mô phỏng trực quan và dụng cụ đo thể tích (TEST_ONLY)',
          objectiveKeys: ['obj-1'],
          taskKeys: ['task-1'],
        },
        {
          component: 'E',
          explanation: 'Thiết kế cấu trúc phân tầng và thử nghiệm tối ưu tốc độ lọc (TEST_ONLY)',
          objectiveKeys: ['obj-2'],
          taskKeys: ['task-1'],
        },
        {
          component: 'M',
          explanation: 'Đo lường thể tích ml và thời gian chảy để tính tốc độ lọc (TEST_ONLY)',
          objectiveKeys: ['obj-1'],
          taskKeys: ['task-1'],
        },
      ],
      scopeOfClip: 'Video hướng dẫn quy trình 6 bước thiết kế bình lọc nước mini lớp 4 (TEST_ONLY)',
      safetyNotes: 'Không dùng vật sắc nhọn; giáo viên chuẩn bị sẵn vỏ chai nhựa đã cắt đáy (TEST_ONLY)',
      steps: [
        { stepKey: 'OPENING_PROBLEM', sceneIds: [firstSceneId], activityKey: 'task-1', objectiveKeys: ['obj-1'] },
        { stepKey: 'BACKGROUND_KNOWLEDGE', sceneIds: [firstSceneId], activityKey: 'task-1', objectiveKeys: ['obj-2'] },
        { stepKey: 'PROPOSE_SOLUTION', sceneIds: [firstSceneId], activityKey: 'task-1', objectiveKeys: ['obj-2'] },
        { stepKey: 'SELECT_SOLUTION', sceneIds: [lastSceneId], activityKey: 'task-1', objectiveKeys: ['obj-1'] },
        { stepKey: 'BUILD_TEST', sceneIds: [lastSceneId], activityKey: 'task-1', objectiveKeys: ['obj-1'] },
        { stepKey: 'CLOSING_SHARE_REFLECT', sceneIds: [lastSceneId], activityKey: 'task-1', objectiveKeys: ['obj-1', 'obj-2'] },
      ],
    },
    evidence: [
      {
        sceneId: firstSceneId,
        taskKey: 'task-1',
        objectiveKey: 'obj-2',
        component: 'S',
        explanation: 'Minh chứng khoa học ở phân cảnh mở đầu bài học (TEST_ONLY)',
      },
      {
        sceneId: lastSceneId,
        taskKey: 'task-1',
        objectiveKey: 'obj-1',
        component: 'M',
        explanation: 'Minh chứng toán học đo lường ở phân cảnh kết thúc (TEST_ONLY)',
      },
    ],
  };

  const saveRes = await request.put(`${API_URL}/scripts/${projectId}/versions/${versionId}/stem`, {
    headers: bearer(writerToken),
    data: briefPayload,
  });
  expect(saveRes.ok(), `PUT save stem brief -> ${saveRes.status()} ${await saveRes.text()}`).toBeTruthy();
  const savedView = await saveRes.json();
  expect(savedView.findings.filter((f: any) => f.severity === 'ERROR')).toEqual([]);
  return { versionId, view: savedView };
}
