import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.title()).toBeTruthy();
  await expect(page.locator('h1')).toContainText('Expense Tracker');
});