import { expect, type Page } from '@playwright/test';

export async function signIn(page: Page, username: string, password: string) {
  // Password workflow tests never load Google's external SDK. The dedicated auth spec
  // installs a test-side GIS implementation to exercise the real component callback.
  await page.route('https://accounts.google.com/gsi/client', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Tài khoản').fill(username);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

/** First login of an Admin-provisioned account (FR-04): the modal blocks everything else. */
export async function changeFirstPassword(page: Page, current: string, next: string) {
  const modal = page.getByRole('heading', { name: 'Đổi Mật Khẩu Lần Đầu' });
  await expect(modal).toBeVisible();
  await page.getByLabel('Mật khẩu hiện tại (được cấp)').fill(current);
  await page.getByLabel('Mật khẩu mới (tối thiểu 8 ký tự)').fill(next);
  await page.getByLabel('Xác nhận mật khẩu mới').fill(next);
  await page.getByRole('button', { name: 'Xác nhận đổi mật khẩu' }).click();
  await expect(modal).toBeHidden();
}

/** Signs in an account whose password was already changed (setupWorkspace). */
export async function signInReady(page: Page, username: string, password: string) {
  await signIn(page, username, password);
  await expect(page.getByRole('button', { name: /Thành viên/ }).first()).toBeVisible();
}

/** Opens a project from the dashboard by its title. */
export async function openProject(page: Page, title: string) {
  await page.getByText(title, { exact: true }).first().click();
}
