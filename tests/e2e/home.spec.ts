import { test, expect } from '@playwright/test';

test.describe('Home Flow', () => {
  // Use a simulated auth state or login manually before each test if required, 
  // but DiuMed intercepts navigation. We will just test that the restricted route kicks you out.
  test('Protected Home cannot be opened unauthenticated', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/.*\/auth/);
  });
});
