import { expect, test, type APIRequestContext } from '@playwright/test';
import { API_URL, CHANGED_PASSWORD, approvedProject, getProject, post, runId, setupWorkspace } from './support/api';
import { openProject, signInReady } from './support/ui';

/**
 * WF-04 Clip review and publishing (owner: Phan Thế Trung).
 * DS-04a: Reviewer pins notes on the clip and sends it back with a reason; Producer resolves them
 * and resubmits; Reviewer approves; Producer publishes to the library with an LMS embed code and
 * the clip is found by subject. DS-04b: a clip with an open note cannot be approved; the YouTube
 * target answers 503 (FR-35 to FR-41; BR-07, BR-13, BR-14).
 */
const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

/** A project rendered once and waiting for video review (IN_QA), as WF-03 leaves it. */
async function clipInReview(request: APIRequestContext, ws: Awaited<ReturnType<typeof setupWorkspace>>, title: string) {
  const id = await approvedProject(request, ws, title);
  await post(request, ws.tokens.PRODUCER, `/render/projects/${id}/start`);
  await expect.poll(async () => (await getProject(request, ws.tokens.PRODUCER, id)).videoStatus, { timeout: 30_000 }).toBe('IN_QA');
  return id;
}

async function openNotes(request: APIRequestContext, token: string, projectId: string) {
  const body = await (await request.get(`${API_URL}/scripts/${projectId}/qa-comments`, auth(token))).json();
  const list = (Array.isArray(body) ? body : body.content) as { id: string; status: string; parentId?: string }[];
  return list.filter((c) => c.status !== 'RESOLVED' && !c.parentId);
}

test.describe.serial('WF-04 clip review and publishing', () => {
  const run = runId();
  const title = `Xuất bản E2E ${run}`;
  let ws: Awaited<ReturnType<typeof setupWorkspace>>;
  let projectId: string;

  test.beforeAll(async ({ request }) => {
    ws = await setupWorkspace(request, run);
    projectId = await clipInReview(request, ws, title);
  });

  test('DS-04a: Reviewer pins two notes and sends the clip back with a reason', async ({ page, request }) => {
    await signInReady(page, ws.reviewer.username, CHANGED_PASSWORD);
    await openProject(page, title);
    await page.getByRole('button', { name: /2\. Duyệt Video Thành Phẩm/ }).click();

    const note = page.getByPlaceholder('Nhập góp ý sư phạm hoặc đồ họa...');
    for (const text of ['Chữ công thức hơi nhỏ.', 'Cảnh 2 cần nhấn mạnh đơn vị Ôm.']) {
      await note.fill(text);
      await page.getByRole('button', { name: 'Ghim Vào Clip' }).click();
      await expect(page.getByText(text).first()).toBeVisible();
    }
    expect(await openNotes(request, ws.tokens.REVIEWER, projectId)).toHaveLength(2);

    await page.getByRole('button', { name: 'Yêu Cầu Producer Sửa Clip' }).click();
    await page.getByRole('dialog').getByRole('textbox').fill('Sửa hai ghi chú rồi gửi lại.');
    await page.getByRole('button', { name: 'Gửi Yêu Cầu Chỉnh Sửa' }).click();
    await expect.poll(async () => (await getProject(request, ws.tokens.REVIEWER, projectId)).videoStatus).toBe('NOT_RENDERED');
  });

  test('DS-04a: Producer sees the reason, resolves the notes and resubmits', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, title);
    await expect(page.getByText('Sửa hai ghi chú rồi gửi lại.').first()).toBeVisible();

    // FR-25: the Producer marks each note fixed (the Reviewer studio thread is tested in WF-02).
    for (const n of await openNotes(request, ws.tokens.PRODUCER, projectId)) {
      const res = await request.put(`${API_URL}/qa-comments/${n.id}/resolve`, auth(ws.tokens.PRODUCER));
      expect(res.ok()).toBeTruthy();
    }
    await page.getByRole('button', { name: 'Gửi Reviewer Duyệt Clip' }).click();
    await expect.poll(async () => (await getProject(request, ws.tokens.PRODUCER, projectId)).videoStatus).toBe('IN_QA');
  });

  test('DS-04a: Reviewer approves the clip', async ({ page, request }) => {
    await signInReady(page, ws.reviewer.username, CHANGED_PASSWORD);
    await openProject(page, title);
    await page.getByRole('button', { name: /2\. Duyệt Video Thành Phẩm/ }).click();
    await page.getByRole('button', { name: /Duyệt Video ➔/ }).click();
    // Approving a composition starts its MP4 render (BR-13); the clip is approved once it is done.
    await expect.poll(async () => (await getProject(request, ws.tokens.REVIEWER, projectId)).videoStatus, { timeout: 30_000 })
      .toBe('APPROVED');
  });

  test('DS-04a: Producer publishes to the library and gets the LMS embed code', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, title);
    await page.getByRole('button', { name: /Xuất bản \(đã duyệt\)/ }).click();
    await page.getByRole('button', { name: 'Xuất bản vào thư viện & lấy mã nhúng LMS' }).click();
    await expect(page.getByLabel('Mã nhúng LMS')).toHaveValue(/<iframe|embed/i);
    await expect.poll(async () => (await getProject(request, ws.tokens.PRODUCER, projectId)).videoStatus).toBe('PUBLISHED');

    await page.getByRole('button', { name: 'Đóng', exact: true }).first().click();
    await page.getByRole('button', { name: /Thư Viện Media/ }).click();
    await page.getByLabel('Lọc theo môn học').selectOption('Physics');
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test('DS-04b: a clip with an open note cannot be approved; YouTube answers 503', async ({ page, request }) => {
    const blockedTitle = `Ghi chú mở ${run}`;
    const id = await clipInReview(request, ws, blockedTitle);
    await signInReady(page, ws.reviewer.username, CHANGED_PASSWORD);
    await openProject(page, blockedTitle);
    await page.getByRole('button', { name: /2\. Duyệt Video Thành Phẩm/ }).click();
    await page.getByPlaceholder('Nhập góp ý sư phạm hoặc đồ họa...').fill('Thiếu đơn vị đo.');
    await page.getByRole('button', { name: 'Ghim Vào Clip' }).click();
    await expect(page.getByText('Thiếu đơn vị đo.').first()).toBeVisible();

    await page.getByRole('button', { name: /Duyệt Video ➔/ }).click();
    await expect(page.getByText(/open review note/i).first()).toBeVisible();
    expect((await getProject(request, ws.tokens.REVIEWER, id)).videoStatus).toBe('IN_QA');

    const approve = await request.post(`${API_URL}/scripts/${id}/approve-video`, { ...auth(ws.tokens.REVIEWER), data: {} });
    expect(approve.status()).toBe(400);

    // BR-14: YouTube publishing is not configured (the published project above is APPROVED-then-PUBLISHED).
    const youtube = await request.post(`${API_URL}/scripts/${projectId}/publish`, {
      ...auth(ws.tokens.PRODUCER),
      data: { targets: ['YOUTUBE'], title, description: 'E2E' },
    });
    expect(youtube.status()).toBe(503);
  });
});
