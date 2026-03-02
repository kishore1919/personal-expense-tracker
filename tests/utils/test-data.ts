/**
 * Test data generators for E2E tests
 * 
 * Provides functions to generate unique test data to prevent
 * conflicts between tests and ensure test isolation.
 */

/**
 * Generate a unique test email address
 * @param prefix - Prefix for the email (default: 'test')
 * @returns Unique email address
 */
export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}.${timestamp}.${random}@test.example.com`;
}

/**
 * Generate a unique test book name
 * @param prefix - Prefix for the book name (default: 'Book')
 * @returns Unique book name
 */
export function generateTestBookName(prefix = 'Book'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const random = Math.floor(Math.random() * 1000);
  return `${prefix} ${timestamp} #${random}`;
}

/**
 * Test expense data structure
 */
export interface TestExpense {
  description: string;
  amount: number;
  type: 'in' | 'out';
  category: string;
  paymentMode: string;
  remarks: string;
}

/**
 * Generate test expense data
 * @param type - Type of expense ('in' for income, 'out' for expense)
 * @returns Test expense object
 */
export function generateTestExpense(type: 'in' | 'out' = 'out'): TestExpense {
  const categories = ['General', 'Food', 'Transport', 'Utilities', 'Entertainment'];
  const paymentModes = ['Cash', 'Online', 'Card', 'UPI'];
  const descriptions = {
    in: ['Salary', 'Refund', 'Investment Return', 'Gift Received', 'Freelance Income'],
    out: ['Groceries', 'Fuel', 'Dinner', 'Shopping', 'Bills', 'Rent', 'Subscriptions'],
  };
  
  const descList = descriptions[type];
  const description = descList[Math.floor(Math.random() * descList.length)];
  const amount = Math.floor(Math.random() * 10000) + 100;
  
  return {
    description: `${description} - ${Date.now()}`,
    amount,
    type,
    category: categories[Math.floor(Math.random() * categories.length)],
    paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
    remarks: `Test expense created at ${new Date().toISOString()}`,
  };
}

/**
 * Generate multiple test expenses
 * @param count - Number of expenses to generate
 * @param type - Type of expenses
 * @returns Array of test expense objects
 */
export function generateMultipleExpenses(count: number, type: 'in' | 'out' = 'out'): TestExpense[] {
  return Array.from({ length: count }, () => generateTestExpense(type));
}

/**
 * Generate a unique test user
 * @returns Test user object with email and password
 */
export function generateTestUser(): { email: string; password: string; displayName: string } {
  const timestamp = Date.now();
  return {
    email: `test.user.${timestamp}@example.com`,
    password: `TestPass${timestamp}!`,
    displayName: `Test User ${timestamp}`,
  };
}

/**
 * Test loan data structure
 */
export interface TestLoan {
  name: string;
  amount: number;
  interestRate: number;
  term: number;
  startDate: string;
  lender: string;
  notes: string;
}

/**
 * Generate test loan data
 * @param prefix - Prefix for the loan name
 * @returns Test loan object
 */
export function generateTestLoan(prefix = 'Loan'): TestLoan {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  return {
    name: `${prefix} ${timestamp} #${random}`,
    amount: Math.floor(Math.random() * 100000) + 1000,
    interestRate: parseFloat((Math.random() * 10 + 1).toFixed(2)),
    term: Math.floor(Math.random() * 60) + 12,
    startDate: new Date().toISOString().split('T')[0],
    lender: `Test Lender ${random}`,
    notes: `Test loan created at ${new Date().toISOString()}`,
  };
}

/**
 * Generate multiple test loans
 * @param count - Number of loans to generate
 * @param prefix - Prefix for loan names
 * @returns Array of test loan objects
 */
export function generateMultipleLoans(count: number, prefix = 'Loan'): TestLoan[] {
  return Array.from({ length: count }, () => generateTestLoan(prefix));
}

/**
 * Test budget data structure
 */
export interface TestBudget {
  name: string;
  amount: number;
  category: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  notes: string;
}

/**
 * Generate test budget data
 * @param prefix - Prefix for the budget name
 * @returns Test budget object
 */
export function generateTestBudget(prefix = 'Budget'): TestBudget {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const periods = ['weekly', 'monthly', 'yearly'] as const;
  const categories = ['General', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare'];

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  return {
    name: `${prefix} ${timestamp} #${random}`,
    amount: Math.floor(Math.random() * 50000) + 1000,
    category: categories[Math.floor(Math.random() * categories.length)],
    period: periods[Math.floor(Math.random() * periods.length)],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    notes: `Test budget created at ${new Date().toISOString()}`,
  };
}

/**
 * Generate multiple test budgets
 * @param count - Number of budgets to generate
 * @param prefix - Prefix for budget names
 * @returns Array of test budget objects
 */
export function generateMultipleBudgets(count: number, prefix = 'Budget'): TestBudget[] {
  return Array.from({ length: count }, () => generateTestBudget(prefix));
}

/**
 * Test subscription data structure
 */
export interface TestSubscription {
  name: string;
  amount: number;
  cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category: string;
  startDate: string;
  paymentMethod: string;
  notes: string;
  reminderEnabled: boolean;
}

/**
 * Generate test subscription data
 * @param prefix - Prefix for the subscription name
 * @returns Test subscription object
 */
export function generateTestSubscription(prefix = 'Subscription'): TestSubscription {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const cycles = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;
  const categories = ['Entertainment', 'Software', 'Utilities', 'Education', 'Health', 'Other'];
  const paymentMethods = ['Credit Card', 'Debit Card', 'Bank Transfer', 'PayPal'];

  return {
    name: `${prefix} ${timestamp} #${random}`,
    amount: parseFloat((Math.random() * 100 + 5).toFixed(2)),
    cycle: cycles[Math.floor(Math.random() * cycles.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    notes: `Test subscription created at ${new Date().toISOString()}`,
    reminderEnabled: Math.random() > 0.5,
  };
}

/**
 * Generate multiple test subscriptions
 * @param count - Number of subscriptions to generate
 * @param prefix - Prefix for subscription names
 * @returns Array of test subscription objects
 */
export function generateMultipleSubscriptions(count: number, prefix = 'Subscription'): TestSubscription[] {
  return Array.from({ length: count }, () => generateTestSubscription(prefix));
}

/**
 * Test investment data structure
 */
export interface TestInvestment {
  name: string;
  type: string;
  value: number;
  shares: number;
  purchaseDate: string;
  notes: string;
}

/**
 * Generate test investment data
 * @param prefix - Prefix for the investment name
 * @returns Test investment object
 */
export function generateTestInvestment(prefix = 'Investment'): TestInvestment {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const types = ['Stock', 'Mutual Fund', 'ETF', 'Bond', 'Crypto', 'Real Estate', 'Other'];

  const value = Math.floor(Math.random() * 100000) + 1000;
  const shares = parseFloat((Math.random() * 1000 + 1).toFixed(4));

  return {
    name: `${prefix} ${timestamp} #${random}`,
    type: types[Math.floor(Math.random() * types.length)],
    value,
    shares,
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: `Test investment created at ${new Date().toISOString()}`,
  };
}

/**
 * Generate multiple test investments
 * @param count - Number of investments to generate
 * @param prefix - Prefix for investment names
 * @returns Array of test investment objects
 */
export function generateMultipleInvestments(count: number, prefix = 'Investment'): TestInvestment[] {
  return Array.from({ length: count }, () => generateTestInvestment(prefix));
}

/**
 * Test settings data structure
 */
export interface TestSettings {
  currency: string;
  language: string;
  darkMode: boolean;
  notifications: boolean;
}

/**
 * Default test settings
 */
export const DEFAULT_SETTINGS: TestSettings = {
  currency: 'USD',
  language: 'en',
  darkMode: false,
  notifications: true,
};

/**
 * Generate test settings data
 * @param overrides - Partial settings to override defaults
 * @returns Test settings object
 */
export function generateTestSettings(overrides?: Partial<TestSettings>): TestSettings {
  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
  const languages = ['en', 'es', 'fr', 'de', 'zh', 'ja'];

  return {
    ...DEFAULT_SETTINGS,
    currency: overrides?.currency || currencies[Math.floor(Math.random() * currencies.length)],
    language: overrides?.language || 'en',
    darkMode: overrides?.darkMode ?? Math.random() > 0.5,
    notifications: overrides?.notifications ?? true,
  };
}
