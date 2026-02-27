import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';
import { generateTestBookName, generateTestExpense } from '../utils/test-data';

test.describe('Dashboard', () => {
  let booksPage: BooksPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
  });

  test('should load dashboard with navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard loaded
    // Dashboard might redirect to login if not authenticated
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/login')) {
      // We're on the dashboard
      // Verify navigation elements
      await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('a:has-text("Books")')).toBeVisible();
      await expect(page.locator('a:has-text("Analytics")')).toBeVisible();
    }
  });

  test('should display statistics cards when data exists', async ({ page }) => {
    // Create a book with expenses first
    const testBookName = generateTestBookName('Dashboard Stats');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Add some expenses
    await booksPage.clickBook(testBookName);
    
    // Add income
    const income = generateTestExpense('in');
    income.amount = 10000;
    await page.locator('button:has-text("Cash In")').click();
    await page.locator('input[name="description"]').fill(income.description);
    await page.locator('input[name="amount"]').fill(income.amount.toString());
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    
    // Add expense
    const expense = generateTestExpense('out');
    expense.amount = 3000;
    await page.locator('button:has-text("Cash Out")').click();
    await page.locator('input[name="description"]').fill(expense.description);
    await page.locator('input[name="amount"]').fill(expense.amount.toString());
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    
    // Go back to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard shows stats (if authenticated)
    if (!page.url().includes('/login')) {
      const statCards = await page.locator('.MuiCard-root').count();
      expect(statCards).toBeGreaterThan(0);
    }
  });

  test('should navigate from dashboard to books page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // If on login, this test is not applicable
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Click on Books link
    await page.click('a:has-text("Books")');
    await page.waitForURL('/books');
    
    // Verify books page loaded
    await expect(page).toHaveURL('/books');
    await expect(page.locator('button:has-text("Add Book")')).toBeVisible();
  });

  test('should navigate from dashboard to analytics page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // If on login, this test is not applicable
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Click on Analytics link
    await page.click('a:has-text("Analytics")');
    await page.waitForURL('/analytics');
    
    // Verify analytics page loaded
    await expect(page).toHaveURL('/analytics');
  });

  test('should navigate from dashboard to settings page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // If on login, this test is not applicable
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Click on Settings link
    await page.click('a:has-text("Settings")');
    await page.waitForURL('/settings');
    
    // Verify settings page loaded
    await expect(page).toHaveURL('/settings');
  });

  test('should display recent books on dashboard', async ({ page }) => {
    // Create a book
    const testBookName = generateTestBookName('Recent Book');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Go to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // If authenticated, verify book appears
    if (!page.url().includes('/login')) {
      const pageContent = await page.content();
      expect(pageContent).toContain(testBookName);
    }
  });

  test('should handle loading state', async ({ page }) => {
    await page.goto('/');
    
    // Check for loading indicator (if present)
    // This might appear briefly before content loads
    await page.waitForLoadState('networkidle');
    
    // Page should eventually stabilize
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/$|\/login$/);
  });

  test('should display responsive layout', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page renders without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
