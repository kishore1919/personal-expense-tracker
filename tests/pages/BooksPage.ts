import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';

/**
 * Books Page Object Model
 * 
 * Encapsulates all interactions with the books management page.
 * Provides methods for creating, searching, and managing books.
 */
export class BooksPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the books page
   */
  async goto() {
    await this.page.goto('/books');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the books page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.books.addBookButton)).toBeVisible();
    await expect(this.page.locator(Selectors.books.searchInput)).toBeVisible();
  }

  /**
   * Click the Add Book button to open the modal
   */
  async clickAddBook() {
    await this.page.locator(Selectors.books.addBookButton).click();
    await this.page.waitForSelector(Selectors.addBookModal.modal, { state: 'visible' });
  }

  /**
   * Fill the book name input in the Add Book modal
   * @param name - The book name to enter
   */
  async fillBookName(name: string) {
    await this.page.locator(Selectors.addBookModal.nameInput).fill(name);
  }

  /**
   * Submit the Add Book form
   */
  async submitBookForm() {
    await this.page.locator(Selectors.addBookModal.submitButton).click();
    // Wait for modal to close
    await this.page.waitForSelector(Selectors.addBookModal.modal, { state: 'hidden', timeout: 10000 });
  }

  /**
   * Create a new book with the given name
   * @param name - The book name
   */
  async createBook(name: string) {
    await this.clickAddBook();
    await this.fillBookName(name);
    await this.submitBookForm();
  }

  /**
   * Search for books by query
   * @param query - The search query
   */
  async searchBooks(query: string) {
    await this.page.locator(Selectors.books.searchInput).fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the count of visible book cards
   * @returns Number of books
   */
  async getBookCount(): Promise<number> {
    try {
      return await this.page.locator(Selectors.books.bookCard).count();
    } catch {
      return 0;
    }
  }

  /**
   * Verify a book with the given name exists
   * @param name - The book name to verify
   */
  async verifyBookExists(name: string) {
    const bookNames = await this.page.locator(Selectors.books.bookName).allTextContents();
    expect(bookNames).toContain(name);
  }

  /**
   * Click on a book to navigate to its detail page
   * @param name - The book name to click
   */
  async clickBook(name: string) {
    const bookCard = this.page.locator(`${Selectors.books.bookCard}:has-text("${name}")`);
    await bookCard.click();
    // Wait for navigation
    await this.page.waitForURL(/\/book\//, { timeout: 10000 });
  }

  /**
   * Delete a book by name
   * @param name - The book name to delete
   */
  async deleteBook(name: string) {
    // Find the book card
    const bookCard = this.page.locator(`${Selectors.books.bookCard}:has-text("${name}")`);
    
    // Click the checkbox to select it
    const checkbox = bookCard.locator('input[type="checkbox"]');
    await checkbox.check();
    
    // Click delete button
    await this.page.locator(Selectors.books.deleteSelectedButton).click();
    
    // Confirm deletion in dialog
    await this.page.locator(Selectors.deleteDialog.confirmButton).click();
    
    // Wait for deletion to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify the empty state is shown
   */
  async verifyEmptyState() {
    await expect(this.page.locator(Selectors.books.emptyState)).toBeVisible();
  }

  /**
   * Click on a quick add suggestion
   * @param suggestion - The suggestion text to click
   */
  async clickQuickAddSuggestion(suggestion: string) {
    await this.page.locator(`text="${suggestion}"`).click();
    // Wait for modal to open
    await this.page.waitForSelector(Selectors.addBookModal.modal, { state: 'visible' });
  }

  /**
   * Select all visible books using the select all checkbox
   */
  async selectAllBooks() {
    await this.page.locator(Selectors.books.selectAllCheckbox).first().check();
  }

  /**
   * Get the text of the pagination info
   * @returns Pagination text
   */
  async getPaginationInfo(): Promise<string> {
    const text = await this.page.locator(Selectors.books.paginationInfo).textContent();
    return text || '';
  }

  /**
   * Get all visible book names
   * @returns Array of book names
   */
  async getAllBookNames(): Promise<string[]> {
    return this.page.locator(Selectors.books.bookName).allTextContents();
  }
}
