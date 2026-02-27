import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TestExpense } from '../utils/test-data';

/**
 * Book Detail Page Object Model
 * 
 * Encapsulates all interactions with the book detail page.
 * Provides methods for managing expenses within a book.
 */
export class BookDetailPage {
  constructor(private page: Page) {}

  /**
   * Navigate to a specific book detail page
   * @param bookId - The book ID
   */
  async goto(bookId: string) {
    await this.page.goto(`/book/${bookId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the book detail page is loaded
   * @param bookName - Optional book name to verify
   */
  async verifyPageLoaded(bookName?: string) {
    await expect(this.page.locator(Selectors.bookDetail.cashInButton)).toBeVisible();
    await expect(this.page.locator(Selectors.bookDetail.cashOutButton)).toBeVisible();
    
    if (bookName) {
      await expect(this.page.locator(Selectors.bookDetail.bookTitle)).toContainText(bookName);
    }
  }

  /**
   * Click the Cash In button to add income
   */
  async clickCashIn() {
    await this.page.locator(Selectors.bookDetail.cashInButton).click();
    await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'visible' });
  }

  /**
   * Click the Cash Out button to add expense
   */
  async clickCashOut() {
    await this.page.locator(Selectors.bookDetail.cashOutButton).click();
    await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'visible' });
  }

  /**
   * Fill the expense form with the given data
   * @param expense - The expense data
   */
  async fillExpenseForm(expense: TestExpense) {
    await this.page.locator(Selectors.addExpenseModal.descriptionInput).fill(expense.description);
    await this.page.locator(Selectors.addExpenseModal.amountInput).fill(expense.amount.toString());
    
    // Handle optional fields if they exist
    const categorySelect = this.page.locator(Selectors.addExpenseModal.categorySelect);
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.selectOption(expense.category);
    }
    
    const paymentModeSelect = this.page.locator(Selectors.addExpenseModal.paymentModeSelect);
    if (await paymentModeSelect.isVisible().catch(() => false)) {
      await paymentModeSelect.selectOption(expense.paymentMode);
    }
    
    const remarksInput = this.page.locator(Selectors.addExpenseModal.remarksInput);
    if (await remarksInput.isVisible().catch(() => false)) {
      await remarksInput.fill(expense.remarks);
    }
  }

  /**
   * Submit the expense form
   * @param keepOpen - Whether to keep the modal open for adding another expense
   */
  async submitExpenseForm(keepOpen = false) {
    if (keepOpen) {
      const saveAndNewButton = this.page.locator(Selectors.addExpenseModal.saveAndNewButton);
      if (await saveAndNewButton.isVisible().catch(() => false)) {
        await saveAndNewButton.click();
      } else {
        await this.page.locator(Selectors.addExpenseModal.submitButton).click();
      }
    } else {
      await this.page.locator(Selectors.addExpenseModal.submitButton).click();
      await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'hidden' });
    }
  }

  /**
   * Add an expense to the book
   * @param expense - The expense data
   * @param keepOpen - Whether to keep the modal open
   */
  async addExpense(expense: TestExpense, keepOpen = false) {
    if (expense.type === 'in') {
      await this.clickCashIn();
    } else {
      await this.clickCashOut();
    }
    await this.fillExpenseForm(expense);
    await this.submitExpenseForm(keepOpen);
  }

  /**
   * Search for expenses
   * @param query - The search query
   */
  async searchExpenses(query: string) {
    await this.page.locator(Selectors.bookDetail.searchInput).fill(query);
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify an expense with the given description exists
   * @param description - The expense description to verify
   */
  async verifyExpenseExists(description: string) {
    const descriptions = await this.page.locator(Selectors.bookDetail.expenseDescription).allTextContents();
    expect(descriptions).toContain(description);
  }

  /**
   * Verify the count of visible expenses
   * @param expectedCount - The expected number of expenses
   */
  async verifyExpenseCount(expectedCount: number) {
    await expect(this.page.locator(Selectors.bookDetail.expenseRow)).toHaveCount(expectedCount);
  }

  /**
   * Get the total Cash In amount
   * @returns The cash in total as a number
   */
  async getTotalCashIn(): Promise<number> {
    // Look for the Cash In card and extract the amount
    const pageContent = await this.page.content();
    const cashInMatch = pageContent.match(/Cash In[\s\S]*?([\d,]+\.?\d*)/);
    if (cashInMatch) {
      return parseFloat(cashInMatch[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Get the total Cash Out amount
   * @returns The cash out total as a number
   */
  async getTotalCashOut(): Promise<number> {
    const pageContent = await this.page.content();
    const cashOutMatch = pageContent.match(/Cash Out[\s\S]*?([\d,]+\.?\d*)/);
    if (cashOutMatch) {
      return parseFloat(cashOutMatch[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Get the Net Balance amount
   * @returns The net balance as a number
   */
  async getNetBalance(): Promise<number> {
    const pageContent = await this.page.content();
    const netBalanceMatch = pageContent.match(/Net Balance[\s\S]*?([\d,]+\.?\d*)/);
    if (netBalanceMatch) {
      return parseFloat(netBalanceMatch[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Click to edit an expense
   * @param description - The expense description to edit
   */
  async clickEditExpense(description: string) {
    const row = this.page.locator(`${Selectors.bookDetail.expenseRow}:has-text("${description}")`);
    await row.locator(Selectors.bookDetail.editExpenseButton).click();
    await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'visible' });
  }

  /**
   * Delete an expense by description
   * @param description - The expense description to delete
   */
  async deleteExpense(description: string) {
    const row = this.page.locator(`${Selectors.bookDetail.expenseRow}:has-text("${description}")`);
    await row.locator('input[type="checkbox"]').check();
    
    // Click the delete button
    await this.page.locator(Selectors.common.deleteButton).first().click();
    
    // Confirm deletion
    await this.page.locator(Selectors.deleteDialog.confirmButton).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Go back to the books list
   */
  async goBack() {
    await this.page.locator(Selectors.bookDetail.backButton).click();
    await this.page.waitForURL('/books');
  }

  /**
   * Navigate to analytics page
   */
  async clickAnalytics() {
    await this.page.locator(Selectors.bookDetail.analyticsButton).click();
    await this.page.waitForURL(/\/book\/.*\/analytics/);
  }

  /**
   * Get all visible expense descriptions
   * @returns Array of expense descriptions
   */
  async getAllExpenseDescriptions(): Promise<string[]> {
    return this.page.locator(Selectors.bookDetail.expenseDescription).allTextContents();
  }

  /**
   * Click the Export button
   */
  async clickExport() {
    await this.page.locator(Selectors.bookDetail.exportButton).click();
  }

  /**
   * Click the Filters button
   */
  async clickFilters() {
    await this.page.locator(Selectors.bookDetail.filterButton).click();
  }

  /**
   * Clear all active filters
   */
  async clearFilters() {
    await this.page.locator(Selectors.bookDetail.clearFiltersButton).click();
  }

  /**
   * Get the current book ID from URL
   * @returns The book ID
   */
  getBookId(): string {
    const url = this.page.url();
    const match = url.match(/\/book\/([^\/]+)/);
    return match ? match[1] : '';
  }
}
