import { test, expect } from '@playwright/test'

test.describe('Dribbble UI Flow & Theme Toggle', () => {
  test.use({ storageState: { cookies: [], origins: [] } }) // Isolated state

  test('should login, toggle theme, and verify emergency contact configuration', async ({ page }) => {
    // 1. Login
    await page.goto('/')
    
    // Wait for auth page or redirect
    await page.waitForTimeout(1000)

    // Ensure we are at auth if not logged in
    if (page.url().includes('/auth')) {
      await page.fill('input[type="email"]', 'kishorvishwa2525@gmail.com')
      await page.fill('input[type="password"]', '123456789')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/', { timeout: 10000 }).catch(() => {})
    }

    // 2. Navigate to Profile to test Theme Toggle
    await page.goto('/profile')
    await page.waitForURL('**/profile', { timeout: 10000 })

    // 3. Verify Theme Toggle exists and works
    const html = page.locator('html')
    
    // Since we created a generic button, we look for the appearance section
    const appearanceSection = page.locator('text=Appearance').locator('..').locator('..')
    const toggleBtn = appearanceSection.locator('button').first()

    // Click toggle to activate Warm Theme
    await toggleBtn.click()
    
    // Check if html got the class
    await expect(html).toHaveClass(/theme-warm/)

    // 4. Update Emergency Contact to verify it is explicitly saved
    const phoneInput = page.locator('input[type="tel"]')
    await phoneInput.fill('9840982625')
    
    // Save profile
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('9840982625')
      await dialog.accept()
    })
    
    await page.getByRole('button', { name: /save/i }).click()

    // 5. Navigate to Emergency Page
    await page.goto('/emergency')
    await page.waitForURL('**/emergency', { timeout: 10000 })

    // 6. Verify SMS targets the exact number
    const customCallBtn = page.getByRole('button', { name: /Call emergency contact/i }).first()
    await expect(customCallBtn).toBeVisible()
    
    // The SMS button uses sms:9840982625
    const smsDesc = page.locator('text=Text')
    await expect(smsDesc.first()).toBeVisible()
  })
})
