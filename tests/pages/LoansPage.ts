import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TIMEOUTS } from '../utils/constants';
import { TestLoan } from '../utils/test-data';

/**
 * Loans Page Object Model
 *
 * Encapsulates all interactions with the loans management page.
 * Provides methods for creating, editing, and managing loans.
 */
export class LoansPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the loans page
   */
  async goto() {
    await this.page.goto('/loans');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the loans page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.loans.page)).toBeVisible();
    await expect(this.page.locator(Selectors.loans.addLoanButton)).toBeVisible();
  }

  /**
   * Get the add loan button
   */
  get addLoanButton() {
    return this.page.locator(Selectors.loans.addLoanButton);
  }

  /**
   * Get the search input
   */
  get searchInput() {
    return this.page.locator(Selectors.loans.searchInput);
  }

  /**
   * Click the Add Loan button to open the modal
   */
  async clickAddLoan() {
    await this.page.locator(Selectors.loans.addLoanButton).click();
    await this.page.waitForSelector(Selectors.loanModal.modal, { state: 'visible' });
  }

  /**
   * Fill the loan name input
   * @param name - The loan name
   */
  async fillLoanName(name: string) {
    await this.page.locator(Selectors.loanModal.nameInput).fill(name);
  }

  /**
   * Fill the loan amount input
   * @param amount - The loan amount
   */
  async fillAmount(amount: number) {
    await this.page.locator(Selectors.loanModal.amountInput).fill(amount.toString());
  }

  /**
   * Fill the interest rate input
   * @param rate - The interest rate
   */
  async fillInterestRate(rate: number) {
    await this.page.locator(Selectors.loanModal.interestRateInput).fill(rate.toString());
  }

  /**
   * Fill the loan term input
   * @param term - The loan term (in months)
   */
  async fillTerm(term: number) {
    await this.page.locator(Selectors.loanModal.termInput).fill(term.toString());
  }

  /**
   * Fill the start date input
   * @param date - The start date (YYYY-MM-DD)
   */
  async fillStartDate(date: string) {
    await this.page.locator(Selectors.loanModal.startDateInput).fill(date);
  }

  /**
   * Fill the lender input
   * @param lender - The lender name
   */
  async fillLender(lender: string) {
    await this.page.locator(Selectors.loanModal.lenderInput).fill(lender);
  }

  /**
   * Fill the notes input
   * @param notes - The notes text
   */
  async fillNotes(notes: string) {
    await this.page.locator(Selectors.loanModal.notesInput).fill(notes);
  }

  /**
   * Submit the Add Loan form
   */
  async submitLoanForm() {
    await this.page.locator(Selectors.loanModal.submitButton).click();
    await this.page.waitForSelector(Selectors.loanModal.modal, { state: 'hidden', timeout: TIMEOUTS.MODAL_ANIMATION * 2 });
  }

  /**
   * Create a new loan with the given data
   * @param loan - Loan data
   */
  async createLoan(loan: Partial<TestLoan>) {
    await this.clickAddLoan();

    if (loan.name) {
      await this.fillLoanName(loan.name);
    }
    if (loan.amount) {
      await this.fillAmount(loan.amount);
    }
    if (loan.interestRate) {
      await this.fillInterestRate(loan.interestRate);
    }
    if (loan.term) {
      await this.fillTerm(loan.term);
    }
    if (loan.startDate) {
      await this.fillStartDate(loan.startDate);
    }
    if (loan.lender) {
      await this.fillLender(loan.lender);
    }
    if (loan.notes) {
      await this.fillNotes(loan.notes);
    }

    await this.submitLoanForm();
  }

  /**
   * Search for loans by query
   * @param query - The search query
   */
  async searchLoans(query: string) {
    await this.page.locator(Selectors.loans.searchInput).fill(query);
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Get the count of visible loan cards
   * @returns Number of loans
   */
  async getLoanCount(): Promise<number> {
    try {
      return await this.page.locator(Selectors.loans.loanCard).count();
    } catch {
      return 0;
    }
  }

  /**
   * Verify a loan with the given name exists
   * @param name - The loan name to verify
   */
  async verifyLoanExists(name: string) {
    const loanNames = await this.page.locator(Selectors.loans.loanName).allTextContents();
    expect(loanNames).toContain(name);
  }

  /**
   * Click on a loan to view details
   * @param name - The loan name to click
   */
  async clickLoan(name: string) {
    const loanCard = this.page.locator(`${Selectors.loans.loanCard}:has-text("${name}")`);
    await loanCard.click();
  }

  /**
   * Edit a loan by name
   * @param name - The loan name to edit
   */
  async editLoan(name: string) {
    const loanCard = this.page.locator(`${Selectors.loans.loanCard}:has-text("${name}")`);
    const editButton = loanCard.locator(Selectors.loans.editButton);
    await editButton.click();
    await this.page.waitForSelector(Selectors.loanModal.modal, { state: 'visible' });
  }

  /**
   * Delete a loan by name
   * @param name - The loan name to delete
   */
  async deleteLoan(name: string) {
    const loanCard = this.page.locator(`${Selectors.loans.loanCard}:has-text("${name}")`);
    const deleteButton = loanCard.locator(Selectors.loans.deleteButton);
    await deleteButton.click();
    await this.page.locator(Selectors.deleteDialog.confirmButton).click();
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Click the pay button for a loan
   * @param name - The loan name
   */
  async clickPayLoan(name: string) {
    const loanCard = this.page.locator(`${Selectors.loans.loanCard}:has-text("${name}")`);
    const payButton = loanCard.locator(Selectors.loans.payButton);
    await payButton.click();
  }

  /**
   * Verify the empty state is shown
   */
  async verifyEmptyState() {
    await expect(this.page.locator(Selectors.loans.emptyState)).toBeVisible();
  }

  /**
   * Get all visible loan names
   * @returns Array of loan names
   */
  async getAllLoanNames(): Promise<string[]> {
    return this.page.locator(Selectors.loans.loanName).allTextContents();
  }

  /**
   * Get loan amount by name
   * @param name - The loan name
   * @returns Loan amount text
   */
  async getLoanAmount(name: string): Promise<string> {
    const loanCard = this.page.locator(`${Selectors.loans.loanCard}:has-text("${name}")`);
    const amount = loanCard.locator(Selectors.loans.loanAmount);
    return await amount.textContent() || '';
  }

  /**
   * Get loan balance by name
   * @param name - The loan name
   * @returns Loan balance text
   */
  async getLoanBalance(name: string): Promise<string> {
    const loanCard = this.page.locator(`${Selectors.loans.loanCard}:has-text("${name}")`);
    const balance = loanCard.locator(Selectors.loans.loanBalance);
    return await balance.textContent() || '';
  }

  /**
   * Get loan status by name
   * @param name - The loan name
   * @returns Loan status text
   */
  async getLoanStatus(name: string): Promise<string> {
    const loanCard = this.page.locator(`${Selectors.loans.loanCard}:has-text("${name}")`);
    const status = loanCard.locator(Selectors.loans.loanStatus);
    return await status.textContent() || '';
  }

  /**
   * Click the filter button
   */
  async clickFilter() {
    await this.page.locator(Selectors.loans.filterButton).click();
  }

  /**
   * Select sort option
   * @param value - Sort option value
   */
  async selectSort(value: string) {
    await this.page.locator(Selectors.loans.sortSelect).selectOption(value);
  }

  /**
   * Wait for success message after operation
   */
  async waitForSuccessMessage() {
    await expect(this.page.locator(Selectors.common.successMessage)).toBeVisible();
  }
}
