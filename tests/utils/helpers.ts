/**
 * Helper functions for E2E tests
 *
 * Common utilities for actions, waits, and retries.
 */

import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS, RETRY_COUNTS } from './constants';

/**
 * Wait for network to be idle
 * @param page - Playwright page instance
 * @param timeout - Custom timeout in ms
 */
export async function waitForNetworkIdle(page: Page, timeout: number = TIMEOUTS.NETWORK_IDLE): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Clear an input field and type new value
 * Handles focus, selection, and typing with proper timing
 * @param locator - Playwright locator for the input
 * @param value - Value to type
 * @param options - Additional options
 */
export async function clearAndType(
  locator: Locator,
  value: string,
  options?: { delay?: number; skipClear?: boolean }
): Promise<void> {
  const { delay = 10, skipClear = false } = options || {};

  await locator.focus();

  if (!skipClear) {
    await locator.selectText();
    await locator.press('Backspace');
  }

  await locator.type(value, { delay });
}

/**
 * Click an element with retry logic
 * Useful for flaky elements that may not be immediately clickable
 * @param locator - Playwright locator to click
 * @param maxRetries - Maximum number of retries
 */
export async function clickWithRetry(
  locator: Locator,
  maxRetries: number = RETRY_COUNTS.DEFAULT
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await locator.click({ timeout: TIMEOUTS.ACTION });
      return; // Success, exit the loop
    } catch (error) {
      lastError = error as Error;
      // Wait before retrying
      await locator.page().waitForTimeout(500 * (attempt + 1));
    }
  }

  // If all retries failed, throw the last error
  throw lastError || new Error('Click failed after all retries');
}

/**
 * Wait for an element to be visible with custom timeout
 * @param locator - Playwright locator to wait for
 * @param timeout - Custom timeout in ms
 */
export async function waitForVisible(
  locator: Locator,
  timeout: number = TIMEOUTS.EXPECT
): Promise<void> {
  await expect(locator).toBeVisible({ timeout });
}

/**
 * Wait for an element to be hidden with custom timeout
 * @param locator - Playwright locator to wait for
 * @param timeout - Custom timeout in ms
 */
export async function waitForHidden(
  locator: Locator,
  timeout: number = TIMEOUTS.EXPECT
): Promise<void> {
  await expect(locator).toBeHidden({ timeout });
}

/**
 * Wait for an element to exist in the DOM with custom timeout
 * @param locator - Playwright locator to wait for
 * @param timeout - Custom timeout in ms
 */
export async function waitForExists(
  locator: Locator,
  timeout: number = TIMEOUTS.EXPECT
): Promise<void> {
  await expect(locator).toBeAttached({ timeout });
}

/**
 * Wait for a modal/dialog to open
 * @param page - Playwright page instance
 * @param modalSelector - CSS selector for the modal
 */
export async function waitForModalOpen(page: Page, modalSelector?: string): Promise<void> {
  const selector = modalSelector || '.MuiDialog-root';
  await page.waitForSelector(selector, { state: 'visible', timeout: TIMEOUTS.MODAL_ANIMATION * 2 });
}

/**
 * Wait for a modal/dialog to close
 * @param page - Playwright page instance
 * @param modalSelector - CSS selector for the modal
 */
export async function waitForModalClose(page: Page, modalSelector?: string): Promise<void> {
  const selector = modalSelector || '.MuiDialog-root';
  await page.waitForSelector(selector, { state: 'hidden', timeout: TIMEOUTS.MODAL_ANIMATION * 2 });
}

/**
 * Fill a form field with retry logic
 * @param locator - Playwright locator for the input
 * @param value - Value to fill
 */
export async function fillWithRetry(
  locator: Locator,
  value: string,
  maxRetries: number = RETRY_COUNTS.DEFAULT
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await locator.fill(value);
      return;
    } catch (error) {
      lastError = error as Error;
      await locator.page().waitForTimeout(300);
    }
  }

  throw lastError || new Error('Fill failed after all retries');
}

/**
 * Select a dropdown option with retry logic
 * @param locator - Playwright locator for the select element
 * @param value - Option value to select
 */
export async function selectWithRetry(
  locator: Locator,
  value: string,
  maxRetries: number = RETRY_COUNTS.DEFAULT
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await locator.selectOption(value);
      return;
    } catch (error) {
      lastError = error as Error;
      await locator.page().waitForTimeout(300);
    }
  }

  throw lastError || new Error('Select failed after all retries');
}

/**
 * Check if an element is visible
 * @param locator - Playwright locator to check
 * @returns True if visible, false otherwise
 */
export async function isVisible(locator: Locator): Promise<boolean> {
  try {
    await expect(locator).toBeVisible({ timeout: TIMEOUTS.EXPECT });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content with fallback
 * @param locator - Playwright locator
 * @returns Text content or empty string
 */
export async function getText(locator: Locator): Promise<string> {
  try {
    return await locator.textContent() || '';
  } catch {
    return '';
  }
}

/**
 * Wait for URL to match a pattern
 * @param page - Playwright page instance
 * @param pattern - URL pattern (string or RegExp)
 * @param timeout - Custom timeout in ms
 */
export async function waitForUrl(
  page: Page,
  pattern: string | RegExp,
  timeout: number = TIMEOUTS.NAVIGATION
): Promise<void> {
  if (typeof pattern === 'string') {
    await page.waitForURL(pattern, { timeout });
  } else {
    await page.waitForURL(pattern, { timeout });
  }
}

/**
 * Take a screenshot with timestamp
 * @param page - Playwright page instance
 * @param name - Screenshot name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Scroll element into view and wait
 * @param locator - Playwright locator to scroll
 */
export async function scrollIntoView(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.page().waitForTimeout(300);
}

/**
 * Wait for loading state to disappear
 * @param page - Playwright page instance
 * @param loaderSelector - Optional custom loader selector
 */
export async function waitForLoading(page: Page, loaderSelector?: string): Promise<void> {
  const selector = loaderSelector || '[role="progressbar"]';
  await page.waitForSelector(selector, { state: 'hidden', timeout: TIMEOUTS.TEST });
}

/**
 * Generate a unique timestamp string
 * @param prefix - Optional prefix
 * @returns Unique string with timestamp
 */
export function generateUniqueString(prefix = ''): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}-${random}`;
}
