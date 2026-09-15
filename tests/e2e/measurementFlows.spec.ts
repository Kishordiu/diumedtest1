import { test, expect } from '@playwright/test';

test.describe('Measurement Flows', () => {
  // Use fake permissions to allow camera
  test.use({ 
    permissions: ['camera', 'microphone'],
  });

  test.beforeEach(async ({ page }) => {
    // Mock the Supabase Auth login endpoint
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh',
          user: { id: 'fake-uuid', email: 'kishorvishwa2525@gmail.com', role: 'authenticated' }
        })
      });
    });
    
    // Mock profile fetch
    await page.route('**/rest/v1/profiles?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'fake-uuid', first_name: 'Kishor', last_name: 'User' })
      });
    });

    // Mock role fetch
    await page.route('**/rest/v1/user_roles?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ role: 'user' })
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'kishorvishwa2525@gmail.com');
    await page.fill('input[type="password"]', '123456789');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
  });

  test('Pulse Touch page loads with immediate UI shell', async ({ page }) => {
    // Navigate directly to pulse touch or via home
    await page.goto('/pulse-touch');
    
    // We expect the shell to render immediately
    await expect(page.getByRole('heading', { name: 'Pulse Touch' })).toBeVisible();
    await expect(page.getByText('CONTACT OPTICAL ESTIMATE')).toBeVisible();

    // The heart sensor UI should be visible
    const video = page.locator('video');
    await expect(video).toBeAttached();

    // Verify it isn't an empty screen
    await expect(page.getByText('Optical Signal')).toBeVisible();
    await expect(page.getByText('Estimate')).toBeVisible();
  });

  test('Bio-Aura page loads with immediate UI shell', async ({ page }) => {
    await page.goto('/bio-aura');
    
    await expect(page.getByRole('heading', { name: 'Bio-Aura' })).toBeVisible();
    await expect(page.getByText('FACIAL OPTICAL ESTIMATE')).toBeVisible();

    // The heart sensor UI should be visible
    const video = page.locator('video');
    await expect(video).toBeAttached();
    
    await expect(page.getByText('Optical Signal')).toBeVisible();
  });

  test('Anemia Screening page loads instructions immediately', async ({ page }) => {
    await page.goto('/vision/anemia');
    
    await expect(page.getByRole('heading', { name: 'Anemia Screening' })).toBeVisible();
    await expect(page.getByText('Conjunctiva Analysis')).toBeVisible();
    await expect(page.getByRole('button', { name: /ACTIVATE SENSOR/i })).toBeVisible();
  });

  test('Sclera Screening page loads instructions immediately', async ({ page }) => {
    await page.goto('/vision/sclera');
    
    await expect(page.getByRole('heading', { name: 'Sclera Screening' })).toBeVisible();
    await expect(page.getByText('Sclera Analysis')).toBeVisible();
    await expect(page.getByRole('button', { name: /ACTIVATE SENSOR/i })).toBeVisible();
  });
});
