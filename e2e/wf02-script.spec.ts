import { expect, test } from '@playwright/test';
import { API_URL, CHANGED_PASSWORD, createProject, getProject, runId, setupWorkspace } from './support/api';
import { openProject, signInReady } from './support/ui';

/**
 * WF-02 Script authoring and approval (owner: Nguyễn Việt Hoàng).
 * DS-02a: Writer drafts with AI, submits; Reviewer returns it with a reason; Writer revises and
 * resubmits; Reviewer approves. DS-02b: a change request needs a reason; a save from a stale tab
 * is refused (409) and keeps the local edits (FR-13, FR-14, FR-18, FR-21, FR-23, FR-24, BR-07, BR-10).
 *
 * The AI draft comes from the E2E back end's local stand-in (no paid call).
 */
test.describe.serial('WF-02 script authoring and approval', () => {
  const run = runId();
  const title = `Định luật Ôm E2E ${run}`;
  let ws: Awaited<ReturnType<typeof setupWorkspace>>;
  let projectId: string;

  test.beforeAll(async ({ request }) => {
    ws = await setupWorkspace(request, run);
  });

  test('DS-02a: Writer drafts the script with AI and submits it for review', async ({ page, request }) => {
    await signInReady(page, ws.writer.email, CHANGED_PASSWORD);
    await page.getByRole('button', { name: 'Tạo Kịch Bản Mới' }).click();
    await page.getByLabel('Chủ đề bài học STEM:').fill(title);
    await page.getByLabel(/Nhờ AI gợi ý bản nháp kịch bản/).check();
    await page.getByRole('button', { name: 'Xem bản nháp AI' }).click();

    // FR-21: nothing is saved until the Writer decides.
    await expect(page.getByText(/Bản nháp AI gợi ý/)).toBeVisible();
    await expect(page.getByText('1. Cường độ dòng điện')).toBeVisible();
    await page.getByRole('button', { name: 'Dùng bản nháp này' }).click();

    await expect(page.getByPlaceholder('Nhập lời giảng sư phạm để AI đọc thuyết minh cho phân cảnh này...')).toBeVisible();
    await page.getByRole('button', { name: /Gửi Kịch Bản Cho Reviewer/ }).click();

    // The draft is titled after the topic; wait until the submit has gone through.
    await expect.poll(async () => {
      const mine = await (await request.get(`${API_URL}/scripts/mine`, { headers: { Authorization: `Bearer ${ws.tokens.WRITER}` } })).json();
      const project = (Array.isArray(mine) ? mine : mine.content).find((p: { title: string }) => p.title === title);
      projectId = project?.id;
      return project?.scriptStatus;
    }).toBe('IN_REVIEW');
  });

  test('DS-02b + DS-02a: a change request needs a reason; Reviewer returns the script', async ({ page, request }) => {
    await signInReady(page, ws.reviewer.email, CHANGED_PASSWORD);
    await openProject(page, title);
    await page.getByRole('button', { name: 'Yêu Cầu Writer Sửa Lại' }).click();

    const send = page.getByRole('button', { name: 'Gửi Yêu Cầu Chỉnh Sửa' });
    await expect(send).toBeDisabled(); // BR-07 in the UI
    await page.getByRole('dialog').getByRole('textbox').fill('Cảnh 2 cần ví dụ thực tế về bóng đèn.');
    await send.click();

    await expect.poll(async () => (await getProject(request, ws.tokens.WRITER, projectId)).scriptStatus).toBe('CHANGE_REQUESTED');

    // BR-07 on the server as well: a return without a reason is refused.
    const second = await createProject(request, ws.tokens.WRITER, ws.workspaceId, `Không lý do ${run}`);
    await request.post(`${API_URL}/scripts/${second}/submit-review`, { headers: { Authorization: `Bearer ${ws.tokens.WRITER}` } });
    const noReason = await request.post(`${API_URL}/scripts/${second}/request-changes`, {
      headers: { Authorization: `Bearer ${ws.tokens.REVIEWER}` },
      data: {},
    });
    expect(noReason.status()).toBe(400);
  });

  test('DS-02a: Writer sees the reason, revises and resubmits', async ({ page, request }) => {
    await signInReady(page, ws.writer.email, CHANGED_PASSWORD);
    await openProject(page, title);
    await expect(page.getByText('Cảnh 2 cần ví dụ thực tế về bóng đèn.').first()).toBeVisible();

    const narration = page.getByPlaceholder('Nhập lời giảng sư phạm để AI đọc thuyết minh cho phân cảnh này...');
    await narration.fill('Khi hiệu điện thế tăng gấp đôi, bóng đèn sáng hơn vì dòng điện cũng tăng gấp đôi.');
    await expect.poll(async () => JSON.stringify((await getProject(request, ws.tokens.WRITER, projectId)).scenes))
      .toContain('bóng đèn sáng hơn');
    await page.getByRole('button', { name: /Gửi Kịch Bản Cho Reviewer/ }).click();
    await expect.poll(async () => (await getProject(request, ws.tokens.WRITER, projectId)).scriptStatus).toBe('IN_REVIEW');
  });

  test('DS-02a: Reviewer approves the revised script', async ({ page, request }) => {
    await signInReady(page, ws.reviewer.email, CHANGED_PASSWORD);
    await openProject(page, title);
    await page.getByRole('button', { name: /Duyệt Kịch Bản ➔ Chuyển Producer/ }).click();
    await expect.poll(async () => (await getProject(request, ws.tokens.WRITER, projectId)).scriptStatus).toBe('APPROVED');

    const history = await (await request.get(`${API_URL}/scripts/${projectId}/review-history`, {
      headers: { Authorization: `Bearer ${ws.tokens.WRITER}` },
    })).json();
    expect(JSON.stringify(history)).toContain('Cảnh 2 cần ví dụ thực tế về bóng đèn.');
  });

  test('DS-02b: a save from a stale tab is refused and keeps the local edits', async ({ browser, request }) => {
    const conflictTitle = `Hai tab ${run}`;
    const id = await createProject(request, ws.tokens.WRITER, ws.workspaceId, conflictTitle);
    const context = await browser.newContext();
    const tabA = await context.newPage();
    await signInReady(tabA, ws.writer.email, CHANGED_PASSWORD);
    await openProject(tabA, conflictTitle);
    const tabB = await context.newPage();
    await tabB.goto('/');
    await openProject(tabB, conflictTitle);

    const placeholder = 'Nhập lời giảng sư phạm để AI đọc thuyết minh cho phân cảnh này...';
    await tabA.getByPlaceholder(placeholder).fill('Bản sửa từ tab A.');
    await expect.poll(async () => JSON.stringify((await getProject(request, ws.tokens.WRITER, id)).scenes)).toContain('Bản sửa từ tab A.');

    await tabB.getByPlaceholder(placeholder).fill('Bản sửa từ tab B, đã cũ.');
    await expect(tabB.getByText(/Bản nháp vừa được lưu ở nơi khác/)).toBeVisible();
    await expect(tabB.getByPlaceholder(placeholder)).toHaveValue('Bản sửa từ tab B, đã cũ.');
    expect(JSON.stringify((await getProject(request, ws.tokens.WRITER, id)).scenes)).not.toContain('tab B');
    await context.close();
  });
});
