import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TIMEOUTS } from '../utils/constants';
import { TestBudget } from '../utils/test-data';

/**
 * Budget Page Object Model
 *
 * Encapsulates all interactions with the budget management page.
 * Provides methods for creating, editing, and managing budgets.
 */
export class BudgetPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the budget page
   */
  async goto() {
    await this.page.goto('/budget');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the budget page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.budget.page)).toBeVisible();
    await expect(this.page.locator(Selectors.budget.addBudgetButton)).toBeVisible();
  }

  /**
   * Get the add budget button
   */
  get addBudgetButton() {
    return this.page.locator(Selectors.budget.addBudgetButton);
  }

  /**
   * Get the search input
   */
  get searchInput() {
    return this.page.locator(Selectors.budget.searchInput);
  }

  /**
   * Click the Add Budget button to open the modal
   */
  async clickAddBudget() {
    await this.page.locator(Selectors.budget.addBudgetButton).click();
    await this.page.waitForSelector(Selectors.budgetModal.modal, { state: 'visible' });
  }

  /**
   * Fill the budget name input
   * @param name - The budget name
   */
  async fillBudgetName(name: string) {
    await this.page.locator(Selectors.budgetModal.nameInput).fill(name);
  }

  /**
   * Fill the budget amount input
   * @param amount - The budget amount
   */
  async fillAmount(amount: number) {
    await this.page.locator(Selectors.budgetModal.amountInput).fill(amount.toString());
  }

  /**
   * Select the budget category
   * @param category - The category to select
   */
  async selectCategory(category: string) {
    await this.page.locator(Selectors.budgetModal.categorySelect).selectOption(category);
  }

  /**
   * Select the budget period
   * @param period - The period to select (weekly, monthly, yearly)
   */
  async selectPeriod(period: string) {
    await this.page.locator(Selectors.budgetModal.periodSelect).selectOption(period);
  }

  /**
   * Fill the start date input
   * @param date - The start date (YYYY-MM-DD)
   */
  async fillStartDate(date: string) {
    await this.page.locator(Selectors.budgetModal.startDateInput).fill(date);
  }

  /**
   * Fill the end date input
   * @param date - The end date (YYYY-MM-DD)
   */
  async fillEndDate(date: string) {
    await this.page.locator(Selectors.budgetModal.endDateInput).fill(date);
  }

  /**
   * Fill the notes input
   * @param notes - The notes text
   */
  async fillNotes(notes: string) {
    await this.page.locator(Selectors.budgetModal.notesInput).fill(notes);
  }

  /**
   * Submit the Add Budget form
   */
  async submitBudgetForm() {
    await this.page.locator(Selectors.budgetModal.submitButton).click();
    await this.page.waitForSelector(Selectors.budgetModal.modal, { state: 'hidden', timeout: TIMEOUTS.MODAL_ANIMATION * 2 });
  }

  /**
   * Create a new budget with the given data
   * @param budget - Budget data
   */
  async createBudget(budget: Partial<TestBudget>) {
    await this.clickAddBudget();

    if (budget.name) {
      await this.fillBudgetName(budget.name);
    }
    if (budget.amount) {
      await this.fillAmount(budget.amount);
    }
    if (budget.category) {
      await this.selectCategory(budget.category);
    }
    if (budget.period) {
      await this.selectPeriod(budget.period);
    }
    if (budget.startDate) {
      await this.fillStartDate(budget.startDate);
    }
    if (budget.endDate) {
      await this.fillEndDate(budget.endDate);
    }
    if (budget.notes) {
      await this.fillNotes(budget.notes);
    }

    await this.submitBudgetForm();
  }

  /**
   * Search for budgets by query
   * @param query - The search query
   */
  async searchBudgets(query: string) {
    await this.page.locator(Selectors.budget.searchInput).fill(query);
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Get the count of visible budget cards
   * @returns Number of budgets
   */
  async getBudgetCount(): Promise<number> {
    try {
      return await this.page.locator(Selectors.budget.budgetCard).count();
    } catch {
      return 0;
    }
  }

  /**
   * Verify a budget with the given name exists
   * @param name - The budget name to verify
   */
  async verifyBudgetExists(name: string) {
    const budgetNames = await this.page.locator(Selectors.budget.budgetName).allTextContents();
    expect(budgetNames).toContain(name);
  }

  /**
   * Click on a budget to view details
   * @param name - The budget name to click
   */
  async clickBudget(name: string) {
    const budgetCard = this.page.locator(`${Selectors.budget.budgetCard}:has-text("${name}")`);
    await budgetCard.click();
  }

  /**
   * Edit a budget by name
   * @param name - The budget name to edit
   */
  async editBudget(name: string) {
    const budgetCard = this.page.locator(`${Selectors.budget.budgetCard}:has-text("${name}")`);
    const editButton = budgetCard.locator(Selectors.budget.editButton);
    await editButton.click();
    await this.page.waitForSelector(Selectors.budgetModal.modal, { state: 'visible' });
  }

  /**
   * Delete a budget by name
   * @param name - The budget name to delete
   */
  async deleteBudget(name: string) {
    const budgetCard = this.page.locator(`${Selectors.budget.budgetCard}:has-text("${name}")`);
    const deleteButton = budgetCard.locator(Selectors.budget.deleteButton);
    await deleteButton.click();
    await this.page.locator(Selectors.deleteDialog.confirmButton).click();
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Verify the empty state is shown
   */
  async verifyEmptyState() {
    await expect(this.page.locator(Selectors.budget.emptyState)).toBeVisible();
  }

  /**
   * Get all visible budget names
   * @returns Array of budget names
   */
  async getAllBudgetNames(): Promise<string[]> {
    return this.page.locator(Selectors.budget.budgetName).allTextContents();
  }

  /**
   * Get budget amount by name
   * @param name - The budget name
   * @returns Budget amount text
   */
  async getBudgetAmount(name: string): Promise<string> {
    const budgetCard = this.page.locator(`${Selectors.budget.budgetCard}:has-text("${name}")`);
    const amount = budgetCard.locator(Selectors.budget.budgetAmount);
    return await amount.textContent() || '';
  }

  /**
   * Get budget progress by name
   * @param name - The budget name
   * @returns Budget progress text
   */
  async getBudgetProgress(name: string): Promise<string> {
    const budgetCard = this.page.locator(`${Selectors.budget.budgetCard}:has-text("${name}")`);
    const progress = budgetCard.locator(Selectors.budget.budgetProgress);
    return await progress.textContent() || '';
  }

  /**
   * Click the filter button
   */
  async clickFilter() {
    await this.page.locator(Selectors.budget.filterButton).click();
  }

  /**
   * Wait for success message after operation
   */
  async waitForSuccessMessage() {
    await expect(this.page.locator(Selectors.common.successMessage)).toBeVisible();
  }
}
