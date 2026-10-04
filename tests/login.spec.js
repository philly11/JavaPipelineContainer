// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('logs in with valid credentials', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('Test1234!');

    const [dialog] = await Promise.all([
      page.waitForEvent('dialog'),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    expect(dialog.message()).toBe('You have successfully logged in.');
    await dialog.accept();
    });

  test('shows an error with invalid credentials', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('wrong');
    await page.getByPlaceholder('Password').fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('#login-error-msg')).toBeVisible();
  });
});