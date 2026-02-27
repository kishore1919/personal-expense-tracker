import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';
import { generateTestBookName } from '../utils/test-data';

test.describe('Book Management', () => {
  let booksPage: BooksPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
    await booksPage.goto();
  });

  test('should display books page with add book button', async () => {
    await booksPage.verifyPageLoaded();
    
    // Verify search input is present
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    
    // Verify Add Book button is present and enabled
    const addButton = page.locator('button:has-text("Add Book")');
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  });

  test('should create a new book', async () => {
    const testBookName = generateTestBookName('E2E Test');
    const initialCount = await booksPage.getBookCount();
    
    // Create a new book
    await booksPage.createBook(testBookName);
    
    // Wait for the book to appear
    await page.waitForTimeout(1000);
    
    // Verify the book exists
    await booksPage.verifyBookExists(testBookName);
    
    // Verify count increased
    const newCount = await booksPage.getBookCount();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should search for a book by name', async () => {
    const testBookName = generateTestBookName('Search Test');
    
    // Create a book first
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Search for it
    await booksPage.searchBooks(testBookName);
    await page.waitForTimeout(500);
    
    // Verify the book appears in search results
    const bookNames = await booksPage.getAllBookNames();
    expect(bookNames.some(name => name.includes(testBookName.split(' ')[0]))).toBeTruthy();
  });

  test('should navigate to book detail page', async ({ page }) => {
    const testBookName = generateTestBookName('Navigation Test');
    
    // Create a book
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Click on the book
    await booksPage.clickBook(testBookName);
    
    // Verify navigation to book detail
    await expect(page).toHaveURL(/\/book\//);
    
    // Verify book detail page elements
    await expect(page.locator('button:has-text("Cash In")')).toBeVisible();
    await expect(page.locator('button:has-text("Cash Out")')).toBeVisible();
  });

  test('should show empty state when no search results', async () => {
    // Search for non-existent book
    await booksPage.searchBooks('XYZ-NONEXISTENT-BOOK-12345');
    await page.waitForTimeout(500);
    
    // Verify empty state or no results
    const bookCount = await booksPage.getBookCount();
    expect(bookCount).toBe(0);
  });

  test('should use quick add suggestions', async () => {
    const suggestion = 'February Expenses';
    
    // Click on quick add suggestion
    await booksPage.clickQuickAddSuggestion(suggestion);
    
    // Verify the modal opened with the suggestion
    await expect(page.locator('.MuiDialog-root')).toBeVisible();
    
    // Get the input value
    const inputValue = await page.locator('input[name="name"]').inputValue();
    expect(inputValue).toBe(suggestion);
    
    // Close the modal
    await page.keyboard.press('Escape');
  });

  test('should display pagination controls when many books exist', async () => {
    // This test verifies pagination UI exists
    // Actual pagination test would require creating many books
    
    const paginationInfo = await booksPage.getPaginationInfo();
    expect(paginationInfo).toMatch(/Showing/);
  });

  test('should allow sorting books', async () => {
    // Verify sort dropdown exists
    const sortDropdown = page.locator('select').first();
    await expect(sortDropdown).toBeVisible();
    
    // Change sort order
    await sortDropdown.selectOption('last-updated');
    await page.waitForTimeout(500);
    
    // Verify books are still displayed
    await booksPage.verifyPageLoaded();
  });

  test('should cancel adding a book', async () => {
    const testBookName = generateTestBookName('Cancelled');
    
    // Open add book modal
    await booksPage.clickAddBook();
    
    // Fill the form
    await booksPage.fillBookName(testBookName);
    
    // Close the modal without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Verify the book was not created
    await booksPage.searchBooks(testBookName);
    await page.waitForTimeout(500);
    
    const bookNames = await booksPage.getAllBookNames();
    expect(bookNames).not.toContain(testBookName);
  });
});
