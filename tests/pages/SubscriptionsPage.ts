import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TIMEOUTS } from '../utils/constants';
import { TestSubscription } from '../utils/test-data';

/**
 * Subscriptions Page Object Model
 *
 * Encapsulates all interactions with the subscriptions management page.
 * Provides methods for creating, editing, and managing subscriptions.
 */
export class SubscriptionsPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the subscriptions page
   */
  async goto() {
    await this.page.goto('/subscriptions');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the subscriptions page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.subscriptions.page)).toBeVisible();
    await expect(this.page.locator(Selectors.subscriptions.addSubscriptionButton)).toBeVisible();
  }

  /**
   * Get the add subscription button
   */
  get addSubscriptionButton() {
    return this.page.locator(Selectors.subscriptions.addSubscriptionButton);
  }

  /**
   * Get the search input
   */
  get searchInput() {
    return this.page.locator(Selectors.subscriptions.searchInput);
  }

  /**
   * Click the Add Subscription button to open the modal
   */
  async clickAddSubscription() {
    await this.page.locator(Selectors.subscriptions.addSubscriptionButton).click();
    await this.page.waitForSelector(Selectors.subscriptionModal.modal, { state: 'visible' });
  }

  /**
   * Fill the subscription name input
   * @param name - The subscription name
   */
  async fillSubscriptionName(name: string) {
    await this.page.locator(Selectors.subscriptionModal.nameInput).fill(name);
  }

  /**
   * Fill the subscription amount input
   * @param amount - The subscription amount
   */
  async fillAmount(amount: number) {
    await this.page.locator(Selectors.subscriptionModal.amountInput).fill(amount.toString());
  }

  /**
   * Select the subscription cycle
   * @param cycle - The cycle to select (weekly, monthly, quarterly, yearly)
   */
  async selectCycle(cycle: string) {
    await this.page.locator(Selectors.subscriptionModal.cycleSelect).selectOption(cycle);
  }

  /**
   * Select the subscription category
   * @param category - The category to select
   */
  async selectCategory(category: string) {
    await this.page.locator(Selectors.subscriptionModal.categorySelect).selectOption(category);
  }

  /**
   * Fill the start date input
   * @param date - The start date (YYYY-MM-DD)
   */
  async fillStartDate(date: string) {
    await this.page.locator(Selectors.subscriptionModal.startDateInput).fill(date);
  }

  /**
   * Select the payment method
   * @param method - The payment method
   */
  async selectPaymentMethod(method: string) {
    await this.page.locator(Selectors.subscriptionModal.paymentMethodSelect).selectOption(method);
  }

  /**
   * Fill the notes input
   * @param notes - The notes text
   */
  async fillNotes(notes: string) {
    await this.page.locator(Selectors.subscriptionModal.notesInput).fill(notes);
  }

  /**
   * Toggle the reminder setting
   */
  async toggleReminder() {
    await this.page.locator(Selectors.subscriptionModal.reminderToggle).click();
  }

  /**
   * Submit the Add Subscription form
   */
  async submitSubscriptionForm() {
    await this.page.locator(Selectors.subscriptionModal.submitButton).click();
    await this.page.waitForSelector(Selectors.subscriptionModal.modal, { state: 'hidden', timeout: TIMEOUTS.MODAL_ANIMATION * 2 });
  }

  /**
   * Create a new subscription with the given data
   * @param subscription - Subscription data
   */
  async createSubscription(subscription: Partial<TestSubscription>) {
    await this.clickAddSubscription();

    if (subscription.name) {
      await this.fillSubscriptionName(subscription.name);
    }
    if (subscription.amount) {
      await this.fillAmount(subscription.amount);
    }
    if (subscription.cycle) {
      await this.selectCycle(subscription.cycle);
    }
    if (subscription.category) {
      await this.selectCategory(subscription.category);
    }
    if (subscription.startDate) {
      await this.fillStartDate(subscription.startDate);
    }
    if (subscription.paymentMethod) {
      await this.selectPaymentMethod(subscription.paymentMethod);
    }
    if (subscription.notes) {
      await this.fillNotes(subscription.notes);
    }
    if (subscription.reminderEnabled !== undefined) {
      await this.toggleReminder();
    }

    await this.submitSubscriptionForm();
  }

  /**
   * Search for subscriptions by query
   * @param query - The search query
   */
  async searchSubscriptions(query: string) {
    await this.page.locator(Selectors.subscriptions.searchInput).fill(query);
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Get the count of visible subscription cards
   * @returns Number of subscriptions
   */
  async getSubscriptionCount(): Promise<number> {
    try {
      return await this.page.locator(Selectors.subscriptions.subscriptionCard).count();
    } catch {
      return 0;
    }
  }

  /**
   * Verify a subscription with the given name exists
   * @param name - The subscription name to verify
   */
  async verifySubscriptionExists(name: string) {
    const subscriptionNames = await this.page.locator(Selectors.subscriptions.subscriptionName).allTextContents();
    expect(subscriptionNames).toContain(name);
  }

  /**
   * Click on a subscription to view details
   * @param name - The subscription name to click
   */
  async clickSubscription(name: string) {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    await subscriptionCard.click();
  }

  /**
   * Edit a subscription by name
   * @param name - The subscription name to edit
   */
  async editSubscription(name: string) {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    const editButton = subscriptionCard.locator(Selectors.subscriptions.editButton);
    await editButton.click();
    await this.page.waitForSelector(Selectors.subscriptionModal.modal, { state: 'visible' });
  }

  /**
   * Delete a subscription by name
   * @param name - The subscription name to delete
   */
  async deleteSubscription(name: string) {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    const deleteButton = subscriptionCard.locator(Selectors.subscriptions.deleteButton);
    await deleteButton.click();
    await this.page.locator(Selectors.deleteDialog.confirmButton).click();
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Cancel a subscription by name
   * @param name - The subscription name to cancel
   */
  async cancelSubscription(name: string) {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    const cancelButton = subscriptionCard.locator(Selectors.subscriptions.cancelSubscriptionButton);
    await cancelButton.click();
    await this.page.locator(Selectors.deleteDialog.confirmButton).click();
  }

  /**
   * Verify the empty state is shown
   */
  async verifyEmptyState() {
    await expect(this.page.locator(Selectors.subscriptions.emptyState)).toBeVisible();
  }

  /**
   * Get all visible subscription names
   * @returns Array of subscription names
   */
  async getAllSubscriptionNames(): Promise<string[]> {
    return this.page.locator(Selectors.subscriptions.subscriptionName).allTextContents();
  }

  /**
   * Get subscription amount by name
   * @param name - The subscription name
   * @returns Subscription amount text
   */
  async getSubscriptionAmount(name: string): Promise<string> {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    const amount = subscriptionCard.locator(Selectors.subscriptions.subscriptionAmount);
    return await amount.textContent() || '';
  }

  /**
   * Get subscription cycle by name
   * @param name - The subscription name
   * @returns Subscription cycle text
   */
  async getSubscriptionCycle(name: string): Promise<string> {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    const cycle = subscriptionCard.locator(Selectors.subscriptions.subscriptionCycle);
    return await cycle.textContent() || '';
  }

  /**
   * Get subscription next bill date by name
   * @param name - The subscription name
   * @returns Next bill date text
   */
  async getSubscriptionNextBill(name: string): Promise<string> {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    const nextBill = subscriptionCard.locator(Selectors.subscriptions.subscriptionNextBill);
    return await nextBill.textContent() || '';
  }

  /**
   * Get subscription status by name
   * @param name - The subscription name
   * @returns Subscription status text
   */
  async getSubscriptionStatus(name: string): Promise<string> {
    const subscriptionCard = this.page.locator(`${Selectors.subscriptions.subscriptionCard}:has-text("${name}")`);
    const status = subscriptionCard.locator(Selectors.subscriptions.subscriptionStatus);
    return await status.textContent() || '';
  }

  /**
   * Click the filter button
   */
  async clickFilter() {
    await this.page.locator(Selectors.subscriptions.filterButton).click();
  }

  /**
   * Click the sort by cycle button
   */
  async clickSortByCycle() {
    await this.page.locator(Selectors.subscriptions.sortByCycle).click();
  }

  /**
   * Wait for success message after operation
   */
  async waitForSuccessMessage() {
    await expect(this.page.locator(Selectors.common.successMessage)).toBeVisible();
  }
}
