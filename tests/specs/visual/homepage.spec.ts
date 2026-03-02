import { test, expect } from '../../fixtures/auth.fixture';
import { TIMEOUTS } from '../../utils/constants';

/**
 * Visual regression tests for Expense Pilot
 *
 * These tests capture screenshots of key pages and compare them
 * against baseline images to detect unintended visual changes.
 *
 * Run with: npx playwright test --grep @visual
 * Update snapshots: UPDATE_SNAPSHOTS=1 npx playwright test --grep @visual
 */

test.describe('Visual Regression Tests', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual tests only run on Chromium');

  test('Login page should look correct', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for any animations to settle
    await page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    // Take full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 50,
    });
  });

  test('Dashboard page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(authenticatedPage).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Books page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/books');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(authenticatedPage).toHaveScreenshot('books-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Analytics page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/analytics');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.NETWORK_IDLE);

    await expect(authenticatedPage).toHaveScreenshot('analytics-page.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test('Settings page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(authenticatedPage).toHaveScreenshot('settings-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Budget page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/budget');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(authenticatedPage).toHaveScreenshot('budget-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Loans page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/loans');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(authenticatedPage).toHaveScreenshot('loans-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Subscriptions page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/subscriptions');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(authenticatedPage).toHaveScreenshot('subscriptions-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Investments page should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/investments');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(authenticatedPage).toHaveScreenshot('investments-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Add Book modal should look correct', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/books');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Add Book button
    await authenticatedPage.locator('button:has-text("Add Book")').click();
    await authenticatedPage.waitForSelector('.MuiDialog-root', { state: 'visible' });
    await authenticatedPage.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    // Screenshot of modal
    const modal = authenticatedPage.locator('.MuiDialog-root');
    await expect(modal).toHaveScreenshot('add-book-modal.png', {
      maxDiffPixels: 50,
    });
  });

  test('Mobile Dashboard should look correct', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
    });

    const page = await context.newPage();

    // Set auth state
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('firebase:authUser:test-project', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        stsTokenManager: {
          apiKey: 'test-api-key',
          refreshToken: 'test-refresh-token',
          accessToken: 'test-access-token',
          expirationTime: Date.now() + 3600000,
        },
        createdAt: Date.now().toString(),
        lastLoginAt: Date.now().toString(),
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);

    await expect(page).toHaveScreenshot('mobile-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });

    await context.close();
  });
});
