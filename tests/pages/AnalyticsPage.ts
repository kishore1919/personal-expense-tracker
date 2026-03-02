import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TIMEOUTS } from '../utils/constants';

/**
 * Analytics Page Object Model
 *
 * Encapsulates all interactions with the analytics page.
 * Provides methods for viewing charts, filtering data, and exporting reports.
 */
export class AnalyticsPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the analytics page
   */
  async goto() {
    await this.page.goto('/analytics');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the analytics page is fully loaded
   */
  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.analytics.page)).toBeVisible();
    await expect(this.page.locator(Selectors.analytics.expenseChart)).toBeVisible();
  }

  /**
   * Get the expense chart element
   */
  get expenseChart() {
    return this.page.locator(Selectors.analytics.expenseChart);
  }

  /**
   * Get the income chart element
   */
  get incomeChart() {
    return this.page.locator(Selectors.analytics.incomeChart);
  }

  /**
   * Get the category chart element
   */
  get categoryChart() {
    return this.page.locator(Selectors.analytics.categoryChart);
  }

  /**
   * Get the date range filter element
   */
  get dateRangeFilter() {
    return this.page.locator(Selectors.analytics.dateRangeFilter);
  }

  /**
   * Get the book filter element
   */
  get bookFilter() {
    return this.page.locator(Selectors.analytics.bookFilter);
  }

  /**
   * Get all summary cards
   */
  get summaryCards() {
    return this.page.locator(Selectors.analytics.summaryCards);
  }

  /**
   * Get the export button
   */
  get exportButton() {
    return this.page.locator(Selectors.analytics.exportButton);
  }

  /**
   * Get the refresh button
   */
  get refreshButton() {
    return this.page.locator(Selectors.analytics.refreshButton);
  }

  /**
   * Filter analytics by date range
   * @param dateRange - Date range option (e.g., 'last-7-days', 'last-30-days', 'last-90-days', 'this-month', 'last-month', 'this-year')
   */
  async filterByDateRange(dateRange: string) {
    await this.page.locator(Selectors.analytics.dateRangeFilter).click();
    await this.page.locator(`[data-value="${dateRange}"]`).click();
    await this.page.waitForTimeout(TIMEOUTS.NETWORK_IDLE);
  }

  /**
   * Filter analytics by book
   * @param bookName - Name of the book to filter by
   */
  async filterByBook(bookName: string) {
    await this.page.locator(Selectors.analytics.bookFilter).selectOption(bookName);
    await this.page.waitForTimeout(TIMEOUTS.NETWORK_IDLE);
  }

  /**
   * Click the export button to export data
   */
  async clickExport() {
    await this.page.locator(Selectors.analytics.exportButton).click();
  }

  /**
   * Click the refresh button to reload data
   */
  async clickRefresh() {
    await this.page.locator(Selectors.analytics.refreshButton).click();
    await this.page.waitForTimeout(TIMEOUTS.NETWORK_IDLE);
  }

  /**
   * Get the expense breakdown data from the chart
   * @returns Array of expense categories with values
   */
  async getExpenseBreakdown(): Promise<Array<{ label: string; value: number }>> {
    // Wait for chart to be visible
    await expect(this.page.locator(Selectors.analytics.expenseChart)).toBeVisible();

    // Try to get data from chart labels
    const chartLabels = this.page.locator(`${Selectors.analytics.expenseChart} [data-testid="chart-label"]`);
    const count = await chartLabels.count();

    const breakdown: Array<{ label: string; value: number }> = [];

    for (let i = 0; i < count; i++) {
      const label = await chartLabels.nth(i).textContent();
      const valueElement = this.page.locator(`${Selectors.analytics.expenseChart} [data-testid="chart-value"]`).nth(i);
      const valueText = await valueElement.textContent();
      const value = parseFloat(valueText?.replace(/[^0-9.]/g, '') || '0');

      if (label) {
        breakdown.push({ label, value });
      }
    }

    return breakdown;
  }

  /**
   * Get the category distribution data
   * @returns Object with category percentages
   */
  async getCategoryDistribution(): Promise<Record<string, number>> {
    await expect(this.page.locator(Selectors.analytics.categoryChart)).toBeVisible();

    const categories = this.page.locator(`${Selectors.analytics.categoryChart} [data-testid="category-item"]`);
    const count = await categories.count();

    const distribution: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
      const category = categories.nth(i);
      const name = await category.locator('[data-testid="category-name"]').textContent();
      const percentageText = await category.locator('[data-testid="category-percentage"]').textContent();
      const percentage = parseFloat(percentageText?.replace(/[^0-9.]/g, '') || '0');

      if (name) {
        distribution[name] = percentage;
      }
    }

    return distribution;
  }

  /**
   * Get summary data from cards
   * @returns Object with summary values
   */
  async getSummaryData(): Promise<{
    totalExpenses: number;
    totalIncome: number;
    netBalance: number;
  }> {
    const cards = this.page.locator(Selectors.analytics.summaryCards);

    const expensesCard = cards.locator('[data-testid="summary-expenses"]');
    const incomeCard = cards.locator('[data-testid="summary-income"]');
    const balanceCard = cards.locator('[data-testid="summary-balance"]');

    const expensesText = await expensesCard.locator('[data-testid="summary-value"]').textContent();
    const incomeText = await incomeCard.locator('[data-testid="summary-value"]').textContent();
    const balanceText = await balanceCard.locator('[data-testid="summary-value"]').textContent();

    return {
      totalExpenses: parseFloat(expensesText?.replace(/[^0-9.]/g, '') || '0'),
      totalIncome: parseFloat(incomeText?.replace(/[^0-9.]/g, '') || '0'),
      netBalance: parseFloat(balanceText?.replace(/[^0-9.]/g, '') || '0'),
    };
  }

  /**
   * Get the trend indicator text
   * @returns Trend indicator text (e.g., "up", "down", "stable")
   */
  async getTrendIndicator(): Promise<string> {
    const trend = this.page.locator(Selectors.analytics.trendIndicator);
    return await trend.textContent() || '';
  }

  /**
   * Verify that charts are visible
   */
  async verifyChartsVisible() {
    await expect(this.page.locator(Selectors.analytics.expenseChart)).toBeVisible();
    await expect(this.page.locator(Selectors.analytics.incomeChart)).toBeVisible();
    await expect(this.page.locator(Selectors.analytics.categoryChart)).toBeVisible();
  }

  /**
   * Verify summary cards are visible
   */
  async verifySummaryCardsVisible() {
    await expect(this.page.locator(Selectors.analytics.summaryCards)).toBeVisible();
  }

  /**
   * Wait for charts to load
   */
  async waitForChartsToLoad(timeout: number = TIMEOUTS.TEST) {
    await this.page.waitForSelector(Selectors.analytics.expenseChart, { state: 'visible', timeout });
    await this.page.waitForSelector(Selectors.analytics.incomeChart, { state: 'visible', timeout });
    await this.page.waitForSelector(Selectors.analytics.categoryChart, { state: 'visible', timeout });
  }

  /**
   * Navigate to book analytics
   * @param bookId - The book ID
   */
  async navigateToBookAnalytics(bookId: string) {
    await this.page.goto(`/book/${bookId}/analytics`);
    await this.page.waitForLoadState('networkidle');
  }
}
