import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';

/**
 * Login Page Object Model
 * 
 * Encapsulates all interactions with the login page.
 * Provides methods for login actions and verifications.
 */
export class LoginPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the login page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.login.appTitle)).toBeVisible();
    await expect(this.page.locator(Selectors.login.appSubtitle)).toBeVisible();
    await expect(this.page.locator(Selectors.login.googleSignInButton)).toBeVisible();
  }

  /**
   * Click the Google Sign-In button
   */
  async clickGoogleSignIn() {
    await this.page.locator(Selectors.login.googleSignInButton).click();
  }

  /**
   * Verify an error message is displayed
   * @param message - The expected error message
   */
  async verifyErrorMessage(message: string) {
    await expect(this.page.locator(Selectors.login.errorAlert)).toContainText(message);
  }

  /**
   * Wait for redirect to home page after successful login
   */
  async waitForRedirectToHome() {
    await this.page.waitForURL('/', { timeout: 30000 });
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Verify the login page URL
   */
  async verifyUrl() {
    await expect(this.page).toHaveURL('/login');
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
