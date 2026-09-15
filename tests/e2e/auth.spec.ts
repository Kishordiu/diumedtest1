import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('Landing page loads and navigates to login', async ({ page }) => {
    await page.goto('/');
    // DiuMed landing redirects to /auth if not logged in
    await expect(page).toHaveURL(/.*\/auth/);
    await expect(page.locator('text=How are you feeling?').first()).not.toBeVisible();
  });

  test('Shows validation for invalid email format', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'invalidemail');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    // Using string matching to be resilient to exact text changes
    await expect(page.locator('.text-signal-rose').first()).toBeVisible();
  });

  test('Can toggle to signup mode and see terms checkbox', async ({ page }) => {
    await page.goto('/auth');
    await page.click('text=CREATE ACCOUNT'); // switch to signup mode
    await expect(page.locator('text=Confirm Password').first()).toBeVisible();
    await expect(page.locator('text=Terms of Use').first()).toBeVisible();
  });

  test('Can toggle to forgot password mode', async ({ page }) => {
    await page.goto('/auth');
    await page.click('text=Forgot password?'); // switch to reset mode
    await expect(page.locator('text=SEND RESET LINK').first()).toBeVisible();
  });
});
