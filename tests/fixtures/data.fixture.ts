/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from '@playwright/test';
import { generateTestBookName, generateTestExpense, TestExpense } from '../utils/test-data';
import { TIMEOUTS } from '../utils/constants';

/**
 * Data seeding fixture for E2E tests
 *
 * Provides fixtures for creating test data in Firebase emulator
 * and cleaning up after tests.
 */

/**
 * Book data for seeding
 */
interface SeededBook {
  id?: string;
  name: string;
  expenses?: TestExpense[];
}

/**
 * Data fixture context
 */
interface DataFixture {
  /**
   * Seed a book with optional expenses
   * @param book - Book data to seed
   * @returns The seeded book data
   */
  seedBook: (book: SeededBook) => Promise<SeededBook>;

  /**
   * Seed multiple books
   * @param books - Array of book data to seed
   * @returns Array of seeded books
   */
  seedBooks: (books: SeededBook[]) => Promise<SeededBook[]>;

  /**
   * Cleanup all seeded data
   */
  cleanupData: () => Promise<void>;

  /**
   * Get the test user ID
   */
  userId: string;
}

/**
 * Extended test fixture with data seeding capabilities
 */
export const test = base.extend<{
  authenticatedPage: Page;
  testUser: { email: string; password: string; displayName: string; uid: string };
} & DataFixture>({
  // Re-use authenticated page from auth fixture
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
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
      }

      await expect(page).not.toHaveURL(/.*login.*/);

    } catch (error) {
      console.error('Error during authentication setup:', error);
    }

    await use(page);

    await context.close();
  },

  // Provide test user
  testUser: async ({}, use) => {
    const timestamp = Date.now();
    const user = {
      email: `test.user.${timestamp}@example.com`,
      password: `TestPass${timestamp}!`,
      displayName: `Test User ${timestamp}`,
      uid: 'test-uid',
    };

    await use(user);
  },

  // Seed book fixture
  seedBook: async ({ authenticatedPage }, use) => {
    const seededBooks: SeededBook[] = [];

    const seedBook = async (book: SeededBook): Promise<SeededBook> => {
      // Navigate to books page
      await authenticatedPage.goto('/books');
      await authenticatedPage.waitForLoadState('networkidle');

      // Click add book button
      await authenticatedPage.locator('button:has-text("Add Book")').click();
      await authenticatedPage.waitForSelector('.MuiDialog-root', { state: 'visible' });

      // Fill book name
      await authenticatedPage.locator('input[name="name"], input[placeholder*="Book"]').fill(book.name);

      // Submit form
      await authenticatedPage.locator('button[type="submit"]').click();
      await authenticatedPage.waitForSelector('.MuiDialog-root', { state: 'hidden', timeout: 10000 });

      // If expenses provided, add them
      if (book.expenses && book.expenses.length > 0) {
        // Find and click the book to open detail page
        const bookCard = authenticatedPage.locator(`[data-testid="book-card"]:has-text("${book.name}")`);
        await bookCard.click();
        await authenticatedPage.waitForURL(/\/book\//, { timeout: 10000 });

        // Add each expense
        for (const expense of book.expenses) {
          // Click Cash In or Cash Out button
          const buttonSelector = expense.type === 'in'
            ? 'button:has-text("Cash In")'
            : 'button:has-text("Cash Out")';

          await authenticatedPage.locator(buttonSelector).click();
          await authenticatedPage.waitForSelector('.MuiDialog-root', { state: 'visible' });

          // Fill expense form
          await authenticatedPage.locator('input[name="description"]').fill(expense.description);
          await authenticatedPage.locator('input[name="amount"]').fill(expense.amount.toString());
          await authenticatedPage.locator('select[name="type"]').selectOption(expense.type);
          await authenticatedPage.locator('select[name="category"]').selectOption(expense.category);
          await authenticatedPage.locator('select[name="paymentMode"]').selectOption(expense.paymentMode);

          if (expense.remarks) {
            await authenticatedPage.locator('textarea[name="remarks"]').fill(expense.remarks);
          }

          // Submit
          await authenticatedPage.locator('button[type="submit"]').click();
          await authenticatedPage.waitForSelector('.MuiDialog-root', { state: 'hidden', timeout: 10000 });
          await authenticatedPage.waitForTimeout(TIMEOUTS.DEBOUNCE);
        }

        // Navigate back to books page
        await authenticatedPage.goto('/books');
      }

      seededBooks.push(book);
      return book;
    };

    await use(seedBook);

    // Cleanup is handled by cleanupData fixture
  },

  // Seed multiple books fixture
  seedBooks: async ({ seedBook }, use) => {
    const seedBooks = async (books: SeededBook[]): Promise<SeededBook[]> => {
      const seeded: SeededBook[] = [];
      for (const book of books) {
        const result = await seedBook(book);
        seeded.push(result);
      }
      return seeded;
    };

    await use(seedBooks);
  },

  // Cleanup data fixture
  cleanupData: async ({ authenticatedPage }, use) => {
    const cleanup = async () => {
      // Navigate to books page
      await authenticatedPage.goto('/books');
      await authenticatedPage.waitForLoadState('networkidle');

      // Select all books
      const selectAllCheckbox = authenticatedPage.locator('input[type="checkbox"]').first();
      const isChecked = await selectAllCheckbox.isChecked();

      if (!isChecked) {
        await selectAllCheckbox.check();
      }

      // Click delete button
      const deleteButton = authenticatedPage.locator('button:has-text("Delete")');
      const isDeleteVisible = await deleteButton.isVisible();

      if (isDeleteVisible) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = authenticatedPage.locator('button:has-text("Delete")').nth(1);
        await confirmButton.click();

        await authenticatedPage.waitForTimeout(TIMEOUTS.DEBOUNCE);
      }
    };

    await use(cleanup);
  },

  // User ID fixture
  userId: async ({ testUser }, use) => {
    await use(testUser.uid);
  },
});

/**
 * Mobile viewport fixture
 */
export const testWithMobileViewport = base.extend<{
  mobilePage: Page;
}>({
  mobilePage: async ({ browser }, use) => {
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

    await use(page);

    await context.close();
  },
});

/**
 * Dynamic auth fixture for custom user credentials
 */
export const testWithCustomAuth = base.extend<{
  customAuthPage: Page;
  customUser: { email: string; password: string; displayName: string };
}>({
  customUser: async ({}, use) => {
    const timestamp = Date.now();
    const user = {
      email: `custom.user.${timestamp}@example.com`,
      password: `CustomPass${timestamp}!`,
      displayName: `Custom User ${timestamp}`,
    };

    await use(user);
  },

  customAuthPage: async ({ browser, customUser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set custom auth state
    await page.evaluate((user) => {
      localStorage.setItem('firebase:authUser:test-project', JSON.stringify({
        uid: 'custom-uid',
        email: user.email,
        displayName: user.displayName,
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
    }, customUser);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await use(page);

    await context.close();
  },
});

export { expect };
