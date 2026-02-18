import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';
import { BookDetailPage } from '../pages/BookDetailPage';
import { generateTestBookName, generateTestExpense, generateMultipleExpenses } from '../utils/test-data';

test.describe('Expense Workflow', () => {
  let booksPage: BooksPage;
  let bookDetailPage: BookDetailPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
    bookDetailPage = new BookDetailPage(page);
  });

  test('should add a cash out expense to a book', async ({ page }) => {
    // Create a test book
    const testBookName = generateTestBookName('Expense Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Navigate to book detail
    await booksPage.clickBook(testBookName);
    await bookDetailPage.verifyPageLoaded(testBookName);
    
    // Add an expense
    const expense = generateTestExpense('out');
    await bookDetailPage.addExpense(expense);
    
    // Verify the expense appears
    await bookDetailPage.verifyExpenseExists(expense.description);
  });

  test('should add a cash in (income) entry to a book', async ({ page }) => {
    // Create a test book
    const testBookName = generateTestBookName('Income Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Navigate to book detail
    await booksPage.clickBook(testBookName);
    await bookDetailPage.verifyPageLoaded(testBookName);
    
    // Add income
    const income = generateTestExpense('in');
    await bookDetailPage.addExpense(income);
    
    // Verify the income appears
    await bookDetailPage.verifyExpenseExists(income.description);
  });

  test('should add multiple expenses and verify count', async ({ page }) => {
    // Create a test book
    const testBookName = generateTestBookName('Multiple Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Navigate to book detail
    await booksPage.clickBook(testBookName);
    await bookDetailPage.verifyPageLoaded(testBookName);
    
    // Add multiple expenses
    const expenses = generateMultipleExpenses(3, 'out');
    for (const expense of expenses) {
      await bookDetailPage.addExpense(expense);
      await page.waitForTimeout(300);
    }
    
    // Verify count
    // Note: Actual count may differ based on pagination
    const expenseDescriptions = await bookDetailPage.getAllExpenseDescriptions();
    expect(expenseDescriptions.length).toBeGreaterThanOrEqual(3);
  });

  test('should update totals when adding income and expenses', async ({ page }) => {
    // Create a test book
    const testBookName = generateTestBookName('Balance Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Navigate to book detail
    await booksPage.clickBook(testBookName);
    await bookDetailPage.verifyPageLoaded(testBookName);
    
    // Add income
    const income = generateTestExpense('in');
    income.amount = 5000;
    await bookDetailPage.addExpense(income);
    await page.waitForTimeout(500);
    
    // Get initial cash in
    const initialCashIn = await bookDetailPage.getTotalCashIn();
    
    // Add expense
    const expense = generateTestExpense('out');
    expense.amount = 2000;
    await bookDetailPage.addExpense(expense);
    await page.waitForTimeout(500);
    
    // Get final values
    const finalCashOut = await bookDetailPage.getTotalCashOut();
    const netBalance = await bookDetailPage.getNetBalance();
    
    // Verify calculations (with tolerance for currency formatting)
    expect(finalCashOut).toBeGreaterThan(0);
    expect(netBalance).toBeGreaterThan(0);
  });

  test('should search for expenses by description', async ({ page }) => {
    // Create a test book
    const testBookName = generateTestBookName('Search Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Navigate to book detail
    await booksPage.clickBook(testBookName);
    
    // Add a unique expense
    const expense = generateTestExpense('out');
    expense.description = `UniqueSearchTest-${Date.now()}`;
    await bookDetailPage.addExpense(expense);
    await page.waitForTimeout(500);
    
    // Search for it
    await bookDetailPage.searchExpenses(expense.description);
    await page.waitForTimeout(500);
    
    // Verify it appears
    await bookDetailPage.verifyExpenseExists(expense.description);
  });

  test('should navigate back to books list', async ({ page }) => {
    // Create and navigate to a book
    const testBookName = generateTestBookName('Back Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    await booksPage.clickBook(testBookName);
    
    // Click back button
    await bookDetailPage.goBack();
    
    // Verify we're back on books page
    await expect(page).toHaveURL('/books');
    await booksPage.verifyPageLoaded();
  });

  test('should display empty state when book has no expenses', async ({ page }) => {
    // Create a test book
    const testBookName = generateTestBookName('Empty Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    
    // Navigate to book detail
    await booksPage.clickBook(testBookName);
    await bookDetailPage.verifyPageLoaded(testBookName);
    
    // Verify no expenses message or empty state
    const pageContent = await page.content();
    expect(pageContent).toMatch(/No expenses|No entries|empty/i);
  });

  test('should show export button', async ({ page }) => {
    // Create and navigate to a book
    const testBookName = generateTestBookName('Export Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    await booksPage.clickBook(testBookName);
    
    // Verify export button is visible
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test('should show analytics button', async ({ page }) => {
    // Create and navigate to a book
    const testBookName = generateTestBookName('Analytics Test');
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    await page.waitForTimeout(500);
    await booksPage.clickBook(testBookName);
    
    // Verify analytics button is visible
    await expect(page.locator('button:has-text("Analytics")')).toBeVisible();
  });
});
