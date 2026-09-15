import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('Auth page matches visual snapshot', async ({ page }) => {
    await page.goto('/auth');
    // Wait for animations to settle
    await page.waitForTimeout(2000);
    expect(await page.screenshot()).toMatchSnapshot('auth-page.png', {
      maxDiffPixelRatio: 0.1, // Allow 10% diff for dynamic elements/animations
    });
  });

  test('Emergency page matches visual snapshot', async ({ page }) => {
    await page.goto('/emergency');
    
    // If redirected to auth, we take snapshot of auth page instead (which is fine for regression if we expect it)
    await page.waitForTimeout(1000);
    expect(await page.screenshot()).toMatchSnapshot('emergency-page.png', {
      maxDiffPixelRatio: 0.1,
    });
  });
});
