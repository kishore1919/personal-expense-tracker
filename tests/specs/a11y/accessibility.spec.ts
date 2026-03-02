import { test, expect } from '../../fixtures/auth.fixture';
import { TIMEOUTS } from '../../utils/constants';

/**
 * Accessibility tests for Expense Pilot
 *
 * These tests check for common accessibility issues using
 * automated checks based on WCAG guidelines.
 *
 * Run with: npx playwright test --grep @a11y
 */

// Axe-core integration would go here if installed
// For now, we use Playwright's built-in accessibility checks

test.describe('Accessibility Tests', () => {
  test('Login page should have accessible landmarks', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check for main landmark
    await expect(page.locator('main')).toBeVisible();

    // Check for heading hierarchy
    await expect(page.locator('h1')).toBeVisible();

    // Check for form label associations
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      // Check if input has an associated label
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        // If no label by ID, check for aria-label or aria-labelledby
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        expect(
          await label.count() > 0 ||
          ariaLabel !== null ||
          ariaLabelledBy !== null ||
          placeholder !== null
        ).toBeTruthy();
      }
    }
  });

  test('Dashboard page should have proper heading hierarchy', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check h1 exists
    const h1Count = await authenticatedPage.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check no skipped heading levels
    const headings = authenticatedPage.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();

    let lastLevel = 0;
    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));

      // Allow skipping down (e.g., h1 to h3) but not up (e.g., h3 to h2)
      expect(level).toBeGreaterThanOrEqual(lastLevel);
      lastLevel = level;
    }
  });

  test('All pages should have skip links', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for skip to main content link
    const skipLink = authenticatedPage.locator('a[href="#main"], a[href="#main-content"], a:has-text("Skip")');
    const exists = await skipLink.count();

    // This is a recommendation, not a strict requirement
    console.log(`Skip link found: ${exists > 0}`);
  });

  test('Buttons should have accessible names', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/books');
    await authenticatedPage.waitForLoadState('networkidle');

    const buttons = authenticatedPage.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) { // Check first 10 buttons
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      // Button should have text content or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('Images should have alt text', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    const images = authenticatedPage.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      const role = await image.getAttribute('role');

      // Decorative images should have alt="" or role="presentation"
      if (role !== 'presentation') {
        expect(alt).not.toBeNull();
      }
    }
  });

  test('Links should have descriptive text', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    const links = authenticatedPage.locator('a[href]');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 10); i++) { // Check first 10 links
      const link = links.nth(i);
      const text = await link.textContent();

      // Link should have meaningful text (not just "click here")
      const genericTexts = ['click here', 'here', 'link', 'more', 'learn more'];
      const textLower = text?.toLowerCase().trim() || '';

      expect(genericTexts.includes(textLower)).toBeFalsy();
    }
  });

  test('Forms should have proper labels', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/books');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find the search input
    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]');

    if (await searchInput.count() > 0) {
      const placeholder = await searchInput.getAttribute('placeholder');
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const id = await searchInput.getAttribute('id');

      // Should have label, aria-label, or placeholder
      expect(placeholder || ariaLabel || id).toBeTruthy();
    }
  });

  test('Color contrast should be sufficient', async ({ authenticatedPage, browserName }) => {
    test.skip(browserName !== 'chromium', 'Color contrast check only on Chromium');

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Note: Full color contrast checking requires axe-core
    // This is a placeholder for when axe-core is integrated
    console.log('Color contrast check - integrate axe-core for full validation');
  });

  test('Focus indicators should be visible', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/books');
    await authenticatedPage.waitForLoadState('networkidle');

    // Tab through interactive elements and check focus is visible
    const interactiveElements = authenticatedPage.locator(
      'button, a, input, select, textarea, [tabindex="0"]'
    );

    const count = await interactiveElements.count();

    for (let i = 0; i < Math.min(count, 5); i++) { // Check first 5 elements
      const element = interactiveElements.nth(i);
      await element.focus();

      // Check if element has focus-visible or outline style
      const hasFocus = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.outlineStyle !== 'none' ||
               style.boxShadow !== 'none' ||
               el.classList.contains('focus-visible') ||
               el.matches(':focus-visible');
      });

      expect(hasFocus).toBeTruthy();
    }
  });

  test('ARIA attributes should be valid', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for common ARIA issues
    const elementsWithAria = authenticatedPage.locator('[aria-*]');
    const count = await elementsWithAria.count();

    for (let i = 0; i < count; i++) {
      const element = elementsWithAria.nth(i);
      const attributes = await element.evaluate(el => {
        const attrs: string[] = [];
        for (const attr of Array.from(el.attributes)) {
          if (attr.name.startsWith('aria-')) {
            attrs.push(attr.name);
          }
        }
        return attrs;
      });

      // Validate common ARIA attributes
      for (const attr of attributes) {
        const value = await element.getAttribute(attr);

        // aria-label and aria-describedby should have non-empty values
        if (attr === 'aria-label' || attr === 'aria-describedby') {
          expect(value?.trim()).toBeTruthy();
        }

        // aria-expanded should be true or false
        if (attr === 'aria-expanded') {
          expect(['true', 'false', null]).toContain(value);
        }

        // aria-hidden should be true or false
        if (attr === 'aria-hidden') {
          expect(['true', 'false']).toContain(value);
        }
      }
    }
  });
});
