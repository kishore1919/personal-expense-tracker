/**
 * Test constants and configuration
 *
 * Centralized constants for timeouts, retry counts, and default test data.
 */

/**
 * Timeout configurations (in milliseconds)
 */
export const TIMEOUTS = {
  /** Default action timeout */
  ACTION: 15000,
  /** Navigation timeout */
  NAVIGATION: 30000,
  /** Test timeout */
  TEST: 60000,
  /** Expect timeout */
  EXPECT: 10000,
  /** Debounce wait for search inputs */
  DEBOUNCE: 500,
  /** Modal open/close animation */
  MODAL_ANIMATION: 500,
  /** Network idle wait */
  NETWORK_IDLE: 2000,
} as const;

/**
 * Retry configurations
 */
export const RETRY_COUNTS = {
  /** Default retry count for flaky actions */
  DEFAULT: 3,
  /** Retry count for network operations */
  NETWORK: 5,
  /** Retry count for element visibility */
  VISIBILITY: 3,
} as const;

/**
 * Default test data
 */
export const DEFAULT_DATA = {
  /** Default viewport size */
  VIEWPORT: {
    width: 1280,
    height: 720,
  },
  /** Mobile viewport size */
  MOBILE_VIEWPORT: {
    width: 375,
    height: 667,
  },
  /** Default currency */
  CURRENCY: 'USD',
  /** Default date format */
  DATE_FORMAT: 'YYYY-MM-DD',
  /** Default pagination limit */
  PAGINATION_LIMIT: 10,
} as const;

/**
 * Test data prefixes for unique generation
 */
export const PREFIXES = {
  EMAIL: 'test.user',
  BOOK: 'Test Book',
  EXPENSE: 'Test Expense',
  LOAN: 'Test Loan',
  BUDGET: 'Test Budget',
  SUBSCRIPTION: 'Test Subscription',
  INVESTMENT: 'Test Investment',
} as const;

/**
 * Test credentials for emulator
 */
export const TEST_CREDENTIALS = {
  DEFAULT_PASSWORD: 'TestPass123!',
  MIN_PASSWORD_LENGTH: 8,
} as const;

/**
 * Firebase emulator configuration
 */
export const FIREBASE_EMULATOR = {
  AUTH_PORT: 9099,
  FIRESTORE_PORT: 8080,
  HOST: '127.0.0.1',
  TEST_API_KEY: 'test-api-key',
} as const;

/**
 * URL paths for navigation
 */
export const PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/',
  BOOKS: '/books',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  BUDGET: '/budget',
  LOANS: '/loans',
  SUBSCRIPTIONS: '/subscriptions',
  INVESTMENTS: '/investments',
} as const;

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  AUTH_USER: 'firebase:authUser:test-project',
  THEME: 'theme',
  CURRENCY: 'currency',
} as const;
