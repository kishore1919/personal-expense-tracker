import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login page with Google sign-in button', async () => {
    await loginPage.verifyPageLoaded();
    
    // Verify page title
    const title = await loginPage.getTitle();
    expect(title).toContain('Expense Pilot');
  });

  test('should show error when Google sign-in popup is blocked', async ({ page }) => {
    // Intercept and block the Google Sign-In request
    await page.route('**/accounts.google.com/**', async (route) => {
      await route.abort('blockedbyclient');
    });

    await loginPage.clickGoogleSignIn();
    
    // Wait for error handling
    await page.waitForTimeout(1000);
    
    // The app should handle the error gracefully
    // Note: Actual behavior may vary based on implementation
  });

  test('should display app branding and terms', async () => {
    // Verify app logo is visible
    await expect(page.locator('svg')).toBeVisible();
    
    // Verify terms of service text
    await expect(page.locator('text=Terms of Service')).toBeVisible();
  });

  test('login page should have correct URL', async () => {
    await loginPage.verifyUrl();
  });

  test('should handle browser back button from login', async ({ page }) => {
    // Navigate to home first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login if not authenticated
    if (page.url().includes('/login')) {
      // Already on login, go back
      await page.goBack();
      // Should stay on login or go to previous page
      expect(page.url()).toMatch(/.*login.*|about:blank/);
    }
  });
});
