import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TIMEOUTS } from '../utils/constants';
import { TestInvestment } from '../utils/test-data';

/**
 * Investments Page Object Model
 *
 * Encapsulates all interactions with the investments management page.
 * Provides methods for creating, editing, and managing investments.
 */
export class InvestmentsPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the investments page
   */
  async goto() {
    await this.page.goto('/investments');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the investments page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.investments.page)).toBeVisible();
    await expect(this.page.locator(Selectors.investments.addInvestmentButton)).toBeVisible();
  }

  /**
   * Get the add investment button
   */
  get addInvestmentButton() {
    return this.page.locator(Selectors.investments.addInvestmentButton);
  }

  /**
   * Get the search input
   */
  get searchInput() {
    return this.page.locator(Selectors.investments.searchInput);
  }

  /**
   * Click the Add Investment button to open the modal
   */
  async clickAddInvestment() {
    await this.page.locator(Selectors.investments.addInvestmentButton).click();
    await this.page.waitForSelector(Selectors.investmentModal.modal, { state: 'visible' });
  }

  /**
   * Fill the investment name input
   * @param name - The investment name
   */
  async fillInvestmentName(name: string) {
    await this.page.locator(Selectors.investmentModal.nameInput).fill(name);
  }

  /**
   * Select the investment type
   * @param type - The type to select (Stock, Mutual Fund, ETF, etc.)
   */
  async selectType(type: string) {
    await this.page.locator(Selectors.investmentModal.typeSelect).selectOption(type);
  }

  /**
   * Fill the investment value input
   * @param value - The investment value
   */
  async fillValue(value: number) {
    await this.page.locator(Selectors.investmentModal.valueInput).fill(value.toString());
  }

  /**
   * Fill the shares input
   * @param shares - The number of shares
   */
  async fillShares(shares: number) {
    await this.page.locator(Selectors.investmentModal.sharesInput).fill(shares.toString());
  }

  /**
   * Fill the purchase date input
   * @param date - The purchase date (YYYY-MM-DD)
   */
  async fillPurchaseDate(date: string) {
    await this.page.locator(Selectors.investmentModal.purchaseDateInput).fill(date);
  }

  /**
   * Fill the notes input
   * @param notes - The notes text
   */
  async fillNotes(notes: string) {
    await this.page.locator(Selectors.investmentModal.notesInput).fill(notes);
  }

  /**
   * Submit the Add Investment form
   */
  async submitInvestmentForm() {
    await this.page.locator(Selectors.investmentModal.submitButton).click();
    await this.page.waitForSelector(Selectors.investmentModal.modal, { state: 'hidden', timeout: TIMEOUTS.MODAL_ANIMATION * 2 });
  }

  /**
   * Create a new investment with the given data
   * @param investment - Investment data
   */
  async createInvestment(investment: Partial<TestInvestment>) {
    await this.clickAddInvestment();

    if (investment.name) {
      await this.fillInvestmentName(investment.name);
    }
    if (investment.type) {
      await this.selectType(investment.type);
    }
    if (investment.value) {
      await this.fillValue(investment.value);
    }
    if (investment.shares) {
      await this.fillShares(investment.shares);
    }
    if (investment.purchaseDate) {
      await this.fillPurchaseDate(investment.purchaseDate);
    }
    if (investment.notes) {
      await this.fillNotes(investment.notes);
    }

    await this.submitInvestmentForm();
  }

  /**
   * Search for investments by query
   * @param query - The search query
   */
  async searchInvestments(query: string) {
    await this.page.locator(Selectors.investments.searchInput).fill(query);
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Get the count of visible investment cards
   * @returns Number of investments
   */
  async getInvestmentCount(): Promise<number> {
    try {
      return await this.page.locator(Selectors.investments.investmentCard).count();
    } catch {
      return 0;
    }
  }

  /**
   * Verify an investment with the given name exists
   * @param name - The investment name to verify
   */
  async verifyInvestmentExists(name: string) {
    const investmentNames = await this.page.locator(Selectors.investments.investmentName).allTextContents();
    expect(investmentNames).toContain(name);
  }

  /**
   * Click on an investment to view details
   * @param name - The investment name to click
   */
  async clickInvestment(name: string) {
    const investmentCard = this.page.locator(`${Selectors.investments.investmentCard}:has-text("${name}")`);
    await investmentCard.click();
  }

  /**
   * Edit an investment by name
   * @param name - The investment name to edit
   */
  async editInvestment(name: string) {
    const investmentCard = this.page.locator(`${Selectors.investments.investmentCard}:has-text("${name}")`);
    const editButton = investmentCard.locator(Selectors.investments.editButton);
    await editButton.click();
    await this.page.waitForSelector(Selectors.investmentModal.modal, { state: 'visible' });
  }

  /**
   * Delete an investment by name
   * @param name - The investment name to delete
   */
  async deleteInvestment(name: string) {
    const investmentCard = this.page.locator(`${Selectors.investments.investmentCard}:has-text("${name}")`);
    const deleteButton = investmentCard.locator(Selectors.investments.deleteButton);
    await deleteButton.click();
    await this.page.locator(Selectors.deleteDialog.confirmButton).click();
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Verify the empty state is shown
   */
  async verifyEmptyState() {
    await expect(this.page.locator(Selectors.investments.emptyState)).toBeVisible();
  }

  /**
   * Get all visible investment names
   * @returns Array of investment names
   */
  async getAllInvestmentNames(): Promise<string[]> {
    return this.page.locator(Selectors.investments.investmentName).allTextContents();
  }

  /**
   * Get investment value by name
   * @param name - The investment name
   * @returns Investment value text
   */
  async getInvestmentValue(name: string): Promise<string> {
    const investmentCard = this.page.locator(`${Selectors.investments.investmentCard}:has-text("${name}")`);
    const value = investmentCard.locator(Selectors.investments.investmentValue);
    return await value.textContent() || '';
  }

  /**
   * Get investment type by name
   * @param name - The investment name
   * @returns Investment type text
   */
  async getInvestmentType(name: string): Promise<string> {
    const investmentCard = this.page.locator(`${Selectors.investments.investmentCard}:has-text("${name}")`);
    const type = investmentCard.locator(Selectors.investments.investmentType);
    return await type.textContent() || '';
  }

  /**
   * Get investment returns by name
   * @param name - The investment name
   * @returns Investment returns text
   */
  async getInvestmentReturns(name: string): Promise<string> {
    const investmentCard = this.page.locator(`${Selectors.investments.investmentCard}:has-text("${name}")`);
    const returns = investmentCard.locator(Selectors.investments.investmentReturns);
    return await returns.textContent() || '';
  }

  /**
   * Click the filter button
   */
  async clickFilter() {
    await this.page.locator(Selectors.investments.filterButton).click();
  }

  /**
   * Click the sort by value button
   */
  async clickSortByValue() {
    await this.page.locator(Selectors.investments.sortByValue).click();
  }

  /**
   * Wait for success message after operation
   */
  async waitForSuccessMessage() {
    await expect(this.page.locator(Selectors.common.successMessage)).toBeVisible();
  }
}
