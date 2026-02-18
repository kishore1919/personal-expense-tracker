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
