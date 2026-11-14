import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL, CHANGED_PASSWORD, approvedProject, getProject, post, runId, setupWorkspace } from './support/api';
import { openProject, signInReady } from './support/ui';

/**
 * RF-08 YouTube publishing (BM04, due 29/11/2026), against STEMotion_BE's fake Google endpoints.
 * Runs only with E2E_YOUTUBE=1: the BE E2eServer then starts E2eYoutubeFake and points every
 * Google URL at it, so the real OAuth, token refresh and resumable-upload code runs unchanged.
 * DS-06a: Producer connects the workspace channel through the consent round trip.
 * DS-06b: Producer publishes to the library and YouTube in one step and sees the upload finish.
 * DS-06c: a quota failure is shown and the upload can be sent again.
 */
const FAKE_GOOGLE = `http://127.0.0.1:${process.env.E2E_YOUTUBE_PORT ?? 18090}`;
const CHANNEL_TITLE = 'Kênh E2E STEMotion';
const QUOTA_ONCE_MARKER = 'YT-QUOTA-ONCE';
const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

test.skip(process.env.E2E_YOUTUBE !== '1', 'needs E2E_YOUTUBE=1 (fake Google endpoints in the BE E2eServer)');

/** A clip rendered and approved by the Reviewer, ready to publish (APPROVED). */
async function approvedClip(request: APIRequestContext, ws: Awaited<ReturnType<typeof setupWorkspace>>, title: string) {
  const id = await approvedProject(request, ws, title);
  await post(request, ws.tokens.PRODUCER, `/render/projects/${id}/start`);
  await expect.poll(async () => (await getProject(request, ws.tokens.PRODUCER, id)).videoStatus, { timeout: 30_000 }).toBe('IN_QA');
  await post(request, ws.tokens.REVIEWER, `/scripts/${id}/approve-video`, {});
  await expect.poll(async () => (await getProject(request, ws.tokens.REVIEWER, id)).videoStatus, { timeout: 30_000 }).toBe('APPROVED');
  return id;
}

/** Opens the publish dialog and confirms the UNVERIFIED STEM lineage when the dialog asks for it (as in WF-05). */
async function openPublish(page: Page) {
  await page.getByRole('button', { name: /Xuất bản \(đã duyệt\)/ }).click();
  await expect(page.getByText(/Trạng thái video:/)).toBeVisible();
  const ack = page.getByRole('checkbox', { name: /Tôi xác nhận xuất bản nội dung chưa được thẩm định STEM/ });
  if (await ack.count()) await ack.check();
}

async function youtubeState(request: APIRequestContext, token: string, projectId: string) {
  const rows = await (await request.get(`${API_URL}/scripts/${projectId}/publications`, auth(token))).json() as { uploadStatus?: string; youtubeUrl?: string; uploadError?: string }[];
  return rows.find(row => row.uploadStatus) ?? null;
}

test.describe.serial('RF-08 YouTube publishing', () => {
  const run = runId();
  const title = `YouTube E2E ${run}`;
  const retryTitle = `YouTube thử lại ${run}`;
  let ws: Awaited<ReturnType<typeof setupWorkspace>>;
  let projectId: string;
  let retryProjectId: string;

  test.beforeAll(async ({ request }) => {
    ws = await setupWorkspace(request, run);
    projectId = await approvedClip(request, ws, title);
    retryProjectId = await approvedClip(request, ws, retryTitle);
  });

  test('DS-06a: Producer connects the workspace YouTube channel', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await page.getByRole('button', { name: new RegExp(`E2E Workspace ${run}`) }).click();
    await page.getByRole('button', { name: 'Kênh YouTube...' }).click();
    const panel = page.getByRole('region', { name: 'Kênh YouTube' });
    await expect(panel.getByText('Chưa kết nối kênh YouTube.')).toBeVisible();

    // Consent page (fake) → API callback → back to /workspaces/{id}/settings, which the app reopens.
    await panel.getByRole('button', { name: 'Kết nối kênh YouTube' }).click();
    await expect(page.getByText(`Đã kết nối kênh YouTube: ${CHANNEL_TITLE}.`).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('region', { name: 'Kênh YouTube' }).getByText(`Đã kết nối: ${CHANNEL_TITLE}`)).toBeVisible();
    await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);

    const status = await (await request.get(`${API_URL}/workspaces/${ws.workspaceId}/youtube`, auth(ws.tokens.PRODUCER))).json();
    expect(status).toMatchObject({ connected: true, channelTitle: CHANNEL_TITLE });
    expect(JSON.stringify(status)).not.toMatch(/e2e-refresh|e2e-access/);
    // Only the workspace Producer (or Admin) may change the channel; a Writer member is refused.
    const writerConnect = await request.post(`${API_URL}/workspaces/${ws.workspaceId}/youtube/connect`, auth(ws.tokens.WRITER));
    expect(writerConnect.status()).toBe(403);
  });

  test('DS-06b: Producer publishes to the library and YouTube in one step', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, title);
    await openPublish(page);
    await page.getByRole('button', { name: /Đăng kèm lên YouTube/ }).click();
    await expect(page.getByText(`Đã kết nối: ${CHANNEL_TITLE}`)).toBeVisible();
    await page.getByLabel('Tiêu đề YouTube').fill(`Đèn dung nham ${run}`);
    await page.getByLabel('Thẻ (cách nhau bằng dấu phẩy)').fill('STEM, VatLi');
    await page.getByRole('button', { name: 'Xuất bản vào thư viện & lấy mã nhúng LMS' }).click();

    await expect(page.getByLabel('Mã nhúng LMS')).toHaveValue(/<iframe|embed/i);
    await expect(page.getByText('YouTube: đã đăng.')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'Mở video trên YouTube' })).toHaveAttribute('href', /youtube\.com\/watch\?v=e2eVideo/);

    expect(await youtubeState(request, ws.tokens.PRODUCER, projectId)).toMatchObject({ uploadStatus: 'UPLOADED' });
    expect((await getProject(request, ws.tokens.PRODUCER, projectId)).videoStatus).toBe('PUBLISHED');
    const uploads = await (await request.get(`${FAKE_GOOGLE}/__e2e/uploads`)).json() as { title: string; privacyStatus: string; bytes: number }[];
    expect(uploads).toContainEqual(expect.objectContaining({ title: `Đèn dung nham ${run}`, privacyStatus: 'private' }));
  });

  test('DS-06c: a quota failure is shown and the upload is sent again', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, retryTitle);
    await openPublish(page);
    await page.getByRole('button', { name: /Đăng kèm lên YouTube/ }).click();
    await page.getByLabel('Tiêu đề YouTube').fill(`Clip ${QUOTA_ONCE_MARKER} ${run}`);
    await page.getByRole('button', { name: 'Xuất bản vào thư viện & lấy mã nhúng LMS' }).click();

    await expect(page.getByText(/YouTube: tải lên thất bại: .*quota/i)).toBeVisible({ timeout: 30_000 });
    expect(await youtubeState(request, ws.tokens.PRODUCER, retryProjectId)).toMatchObject({ uploadStatus: 'FAILED' });

    await page.getByRole('button', { name: 'Đăng lại lên YouTube' }).click();
    const retryAck = page.getByRole('checkbox', { name: /Tôi xác nhận đăng lại nội dung chưa được thẩm định STEM/ });
    await expect(retryAck).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gửi lại lên YouTube' })).toBeDisabled();
    await retryAck.check();
    await page.getByRole('button', { name: 'Gửi lại lên YouTube' }).click();
    await expect(page.getByText('YouTube: đã đăng.')).toBeVisible({ timeout: 30_000 });
    expect(await youtubeState(request, ws.tokens.PRODUCER, retryProjectId)).toMatchObject({ uploadStatus: 'UPLOADED' });
  });
});
