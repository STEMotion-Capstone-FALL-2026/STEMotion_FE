import { expect, type Page } from '@playwright/test';

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
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
export async function signInReady(page: Page, email: string, password: string) {
  await signIn(page, email, password);
  await expect(page.getByRole('button', { name: /Thành viên/ }).first()).toBeVisible();
}

/** Opens a project from the dashboard by its title. */
export async function openProject(page: Page, title: string) {
  await page.getByText(title, { exact: true }).first().click();
}
