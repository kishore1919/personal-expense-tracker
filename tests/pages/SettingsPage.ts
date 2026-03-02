import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TIMEOUTS } from '../utils/constants';

/**
 * Settings Page Object Model
 *
 * Encapsulates all interactions with the settings page.
 * Provides methods for managing user preferences, security, and account settings.
 */
export class SettingsPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the settings page
   */
  async goto() {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the settings page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.settings.page)).toBeVisible();
    await expect(this.page.locator(Selectors.settings.currencySelect)).toBeVisible();
  }

  /**
   * Get the currency select element
   */
  get currencySelect() {
    return this.page.locator(Selectors.settings.currencySelect);
  }

  /**
   * Get the language select element
   */
  get languageSelect() {
    return this.page.locator(Selectors.settings.languageSelect);
  }

  /**
   * Get the dark mode toggle
   */
  get darkModeToggle() {
    return this.page.locator(Selectors.settings.darkModeToggle);
  }

  /**
   * Get the notifications toggle
   */
  get notificationsToggle() {
    return this.page.locator(Selectors.settings.notificationsToggle);
  }

  /**
   * Change the currency setting
   * @param currency - Currency code (USD, EUR, INR, etc.)
   */
  async changeCurrency(currency: string) {
    await this.page.locator(Selectors.settings.currencySelect).selectOption(currency);
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Change the language setting
   * @param language - Language code (en, es, fr, etc.)
   */
  async changeLanguage(language: string) {
    await this.page.locator(Selectors.settings.languageSelect).selectOption(language);
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Toggle dark mode
   */
  async toggleDarkMode() {
    await this.page.locator(Selectors.settings.darkModeToggle).click();
    await this.page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);
  }

  /**
   * Toggle notifications
   */
  async toggleNotifications() {
    await this.page.locator(Selectors.settings.notificationsToggle).click();
    await this.page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);
  }

  /**
   * Check if dark mode is enabled
   * @returns True if dark mode is enabled
   */
  async isDarkModeEnabled(): Promise<boolean> {
    const toggle = this.page.locator(Selectors.settings.darkModeToggle);
    const isChecked = await toggle.isChecked();
    return isChecked;
  }

  /**
   * Check if notifications are enabled
   * @returns True if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const toggle = this.page.locator(Selectors.settings.notificationsToggle);
    const isChecked = await toggle.isChecked();
    return isChecked;
  }

  /**
   * Click the change password button
   */
  async clickChangePassword() {
    await this.page.locator(Selectors.settings.changePasswordButton).click();
  }

  /**
   * Click the delete account button
   */
  async clickDeleteAccount() {
    await this.page.locator(Selectors.settings.deleteAccountButton).click();
  }

  /**
   * Click the logout button
   */
  async clickLogout() {
    await this.page.locator(Selectors.settings.logoutButton).click();
  }

  /**
   * Click the save button
   */
  async clickSave() {
    await this.page.locator(Selectors.settings.saveButton).click();
    await this.page.waitForTimeout(TIMEOUTS.DEBOUNCE);
  }

  /**
   * Click the reset button
   */
  async clickReset() {
    await this.page.locator(Selectors.settings.resetButton).click();
  }

  /**
   * Verify the profile section is visible
   */
  async verifyProfileSection() {
    await expect(this.page.locator(Selectors.settings.profileSection)).toBeVisible();
  }

  /**
   * Verify the preferences section is visible
   */
  async verifyPreferencesSection() {
    await expect(this.page.locator(Selectors.settings.preferencesSection)).toBeVisible();
  }

  /**
   * Verify the security section is visible
   */
  async verifySecuritySection() {
    await expect(this.page.locator(Selectors.settings.securitySection)).toBeVisible();
  }

  /**
   * Get the current currency display value
   * @returns Current currency value
   */
  async getCurrentCurrency(): Promise<string> {
    const select = this.page.locator(Selectors.settings.currencySelect);
    return await select.inputValue();
  }

  /**
   * Get the current language display value
   * @returns Current language value
   */
  async getCurrentLanguage(): Promise<string> {
    const select = this.page.locator(Selectors.settings.languageSelect);
    return await select.inputValue();
  }

  /**
   * Wait for success message after saving
   */
  async waitForSuccessMessage() {
    await expect(this.page.locator(Selectors.common.successMessage)).toBeVisible();
  }

  /**
   * Wait for error message
   */
  async waitForErrorMessage() {
    await expect(this.page.locator(Selectors.common.errorMessage)).toBeVisible();
  }
}
