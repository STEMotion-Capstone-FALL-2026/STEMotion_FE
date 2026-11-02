import { expect, test, type APIRequestContext } from '@playwright/test';
import { API_URL, CHANGED_PASSWORD, approvedProject, getProject, runId, setupWorkspace } from './support/api';
import { openProject, signInReady } from './support/ui';

/**
 * WF-03 Production and rendering (owner: Trần Nguyễn Hoàng Lê).
 * DS-03a: Producer opens the approved script as a composition, changes the theme, syncs scene
 * durations to the narration and renders the MP4, which then waits for video review.
 * DS-03b: a failed render shows as failed with a retry; a second render while one runs is a 409
 * (FR-26 to FR-30, FR-32 to FR-34, FR-54; BR-09).
 *
 * TTS, duration sync and rendering are answered by the E2E back end's local render-worker
 * stand-in, which reports through the real callback endpoint.
 */
const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

async function composition(request: APIRequestContext, token: string, projectId: string) {
  return (await request.get(`${API_URL}/scripts/${projectId}/composition`, auth(token))).json();
}

async function jobs(request: APIRequestContext, token: string, projectId: string) {
  const body = await (await request.get(`${API_URL}/render/projects/${projectId}/jobs`, auth(token))).json();
  return (Array.isArray(body) ? body : body.content) as { jobId: string; status: string }[];
}

test.describe.serial('WF-03 production and rendering', () => {
  const run = runId();
  const title = `Sản xuất E2E ${run}`;
  let ws: Awaited<ReturnType<typeof setupWorkspace>>;
  let projectId: string;

  test.beforeAll(async ({ request }) => {
    ws = await setupWorkspace(request, run);
    projectId = await approvedProject(request, ws, title);
  });

  test('DS-03a: Producer opens the composition, changes the theme and syncs durations', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, title);
    // Wait for the composition: a theme picked before it loads is not saved.
    await expect(page.getByText(/Bản dựng (chưa chỉnh|r\d+)/)).toBeVisible();

    await page.getByTitle(/Chọn bộ Theme màu/).selectOption('cyber');
    await expect.poll(async () => (await composition(request, ws.tokens.PRODUCER, projectId)).visualTheme).toBe('cyber');

    // Two 10 s scenes of about ten words: the worker measures roughly 3 s each.
    await page.getByRole('button', { name: /Tự Khớp Giọng Đọc/ }).click();
    await expect.poll(async () => (await composition(request, ws.tokens.PRODUCER, projectId)).scenes
      .map((s: { durationInFrames: number }) => s.durationInFrames)).toEqual([90, 90]);
  });

  test('DS-03a: Producer renders the MP4; the finished clip goes to video review', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, title);
    await expect(page.getByText(/Bản dựng (chưa chỉnh|r\d+)/)).toBeVisible();

    await page.getByRole('button', { name: /Kết xuất bản dựng r\d+/ }).click();
    await expect.poll(async () => (await jobs(request, ws.tokens.PRODUCER, projectId))[0]?.status, { timeout: 30_000 })
      .toBe('COMPLETED');

    await page.getByRole('button', { name: 'Lịch sử Render' }).first().click();
    await expect(page.getByText('Hoàn tất').first()).toBeVisible();
    await page.keyboard.press('Escape');

    // A completed render of the composition moves the clip to video review (RENDERING -> IN_QA).
    await expect.poll(async () => (await getProject(request, ws.tokens.PRODUCER, projectId)).videoStatus).toBe('IN_QA');
    await expect(page.getByText('Đang Chờ Reviewer Duyệt Clip')).toBeVisible();
  });

  test('DS-03b: a failed render shows as failed and can be retried', async ({ page, request }) => {
    const failing = `Lỗi render [render-fail] ${run}`;
    const id = await approvedProject(request, ws, failing);
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, failing);
    await expect(page.getByText(/Bản dựng (chưa chỉnh|r\d+)/)).toBeVisible();

    await page.getByRole('button', { name: /Kết xuất bản dựng r\d+|Kết xuất MP4/ }).click();
    await expect.poll(async () => (await jobs(request, ws.tokens.PRODUCER, id))[0]?.status, { timeout: 30_000 }).toBe('FAILED');
    await expect.poll(async () => (await getProject(request, ws.tokens.PRODUCER, id)).videoStatus).toBe('NOT_RENDERED');

    await page.getByRole('button', { name: 'Lịch sử Render' }).first().click();
    await expect(page.getByText('Thất bại').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Thử lại \(Retry\)/ }).first()).toBeVisible();
  });

  test('DS-03b: a second render while one is running is refused (409)', async ({ request }) => {
    const id = await approvedProject(request, ws, `Render đôi ${run}`);
    const first = await request.post(`${API_URL}/render/projects/${id}/start`, { ...auth(ws.tokens.PRODUCER), data: {} });
    expect(first.ok(), `first render: ${first.status()} ${await first.text()}`).toBeTruthy();
    const second = await request.post(`${API_URL}/render/projects/${id}/start`, { ...auth(ws.tokens.PRODUCER), data: {} });
    expect(second.status()).toBe(409);
  });
});
