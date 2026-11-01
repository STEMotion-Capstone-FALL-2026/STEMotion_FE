import { expect, test } from '@playwright/test';
import { API_URL, ADMIN, CHANGED_PASSWORD, INITIAL_PASSWORD, login, provisionTeam, runId } from './support/api';
import { changeFirstPassword, signIn } from './support/ui';
import type { Page } from '@playwright/test';

/** The form pre-fills two members once three users exist; start every team from the leader alone. */
async function openWorkspaceForm(page: Page) {
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.getByRole('button', { name: /Người Dùng & Phân Quyền/ }).click();
  await expect(page.getByLabel('Chỉ định Trưởng nhóm *')).toBeEnabled();
  const remove = page.getByRole('button', { name: /^Xóa thành viên bổ sung/ });
  while (await remove.count()) await remove.first().click();
}

/**
 * WF-01 Team setup and onboarding (owner: Phan Phước Long Trì).
 * DS-01a: Admin creates a workspace with the three roles; a new member changes the initial
 * password at first login. DS-01b: a team without a PRODUCER cannot be created, and a Leader
 * cannot remove members (BR-01, BR-02; FR-04, FR-06 to FR-08).
 */
test.describe.serial('WF-01 team setup and onboarding', () => {
  const run = runId();
  const workspaceName = `E2E Vật Lý ${run}`;
  let team: Awaited<ReturnType<typeof provisionTeam>>;

  test.beforeAll(async ({ request }) => {
    team = await provisionTeam(request, run);
  });

  test('DS-01b: a team without a PRODUCER cannot be submitted', async ({ page }) => {
    await openWorkspaceForm(page);

    await page.getByLabel('Tên Không gian làm việc *').fill(`${workspaceName} (thiếu Producer)`);
    await page.getByLabel('Chỉ định Trưởng nhóm *').selectOption(team.writer.id);
    await page.getByLabel('Vai trò chuyên môn của Leader *').selectOption('WRITER');
    await page.getByRole('button', { name: 'Thêm thành viên' }).click();
    await page.getByLabel('Thành viên bổ sung 1', { exact: true }).selectOption(team.reviewer.id);
    await page.getByLabel('Vai trò thành viên bổ sung 1').selectOption('REVIEWER');

    await expect(page.getByText('Nhóm còn thiếu vai trò:')).toContainText('PRODUCER');
    await expect(page.getByRole('button', { name: 'Tạo không gian làm việc' })).toBeDisabled();
  });

  test('DS-01a: Admin creates a workspace covering WRITER, REVIEWER and PRODUCER', async ({ page }) => {
    await openWorkspaceForm(page);

    await page.getByLabel('Tên Không gian làm việc *').fill(workspaceName);
    await page.getByLabel('Bộ môn / Lĩnh vực').fill('Vật Lý');
    await page.getByLabel('Chỉ định Trưởng nhóm *').selectOption(team.writer.id);
    await page.getByLabel('Vai trò chuyên môn của Leader *').selectOption('WRITER');
    await page.getByRole('button', { name: 'Thêm thành viên' }).click();
    await page.getByLabel('Thành viên bổ sung 1', { exact: true }).selectOption(team.reviewer.id);
    await page.getByLabel('Vai trò thành viên bổ sung 1').selectOption('REVIEWER');
    await page.getByRole('button', { name: 'Thêm thành viên' }).click();
    await page.getByLabel('Thành viên bổ sung 2', { exact: true }).selectOption(team.producer.id);
    await page.getByLabel('Vai trò thành viên bổ sung 2').selectOption('PRODUCER');

    await expect(page.getByText(/Đội ngũ hợp lệ/)).toBeVisible();
    await page.getByRole('button', { name: 'Tạo không gian làm việc' }).click();
    await expect(page.getByRole('status').filter({ hasText: workspaceName })).toBeVisible();
  });

  test('DS-01a: a new member must change the initial password at first login', async ({ page, request }) => {
    await signIn(page, team.reviewer.email, INITIAL_PASSWORD);
    await changeFirstPassword(page, INITIAL_PASSWORD, CHANGED_PASSWORD);
    await expect(page.getByRole('button', { name: /Thành viên/ }).first()).toBeVisible();

    // The old password no longer works; the new one does.
    const old = await request.post(`${API_URL}/auth/login`, {
      data: { email: team.reviewer.email, password: INITIAL_PASSWORD },
    });
    expect(old.ok()).toBeFalsy();
    await login(request, team.reviewer.email, CHANGED_PASSWORD);
  });

  test('DS-01b: a Leader assigns roles but cannot remove members', async ({ page, request }) => {
    await signIn(page, team.writer.email, INITIAL_PASSWORD);
    await changeFirstPassword(page, INITIAL_PASSWORD, CHANGED_PASSWORD);

    await page.getByRole('button', { name: /Thành viên/ }).first().click();
    await expect(page.getByText('Phân Công Vai Trò (Leader):')).toBeVisible();
    await expect(page.getByLabel(`Vai trò của ${team.producer.fullName}`)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Xóa thành viên/ })).toHaveCount(0);

    // Hiding the button is not the control (BR-20): the API refuses the Leader as well.
    const token = await login(request, team.writer.email, CHANGED_PASSWORD);
    const auth = { Authorization: `Bearer ${token}` };
    const mine = await (await request.get(`${API_URL}/workspaces/mine`, { headers: auth })).json();
    const workspace = (Array.isArray(mine) ? mine : mine.content).find((w: { name: string }) => w.name === workspaceName);
    const members = await (await request.get(`${API_URL}/workspaces/${workspace.id}/members`, { headers: auth })).json();
    const producer = members.find((m: { userId: string }) => m.userId === team.producer.id);
    const removal = await request.delete(`${API_URL}/workspaces/${workspace.id}/members/${producer.id}`, { headers: auth });
    expect(removal.status()).toBe(403);
  });
});
