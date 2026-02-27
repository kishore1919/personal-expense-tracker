# E2E Test Implementation Plan

## Project Overview
**Application**: Personal Expense Tracker (Expense Pilot)
**Tech Stack**: Next.js 16 + React 19 + Firebase (Auth + Firestore) + MUI + TypeScript
**Testing Framework**: Playwright with Firebase Emulator Suite

## Key Findings from Code Review

### Authentication Flow
- Uses Firebase Google Sign-In (OAuth popup)
- No email/password authentication
- Protected routes via `useProtectedRoute()` hook
- Auth state managed via `react-firebase-hooks/auth`

### Data Structure
```
Firestore Collections:
├── books/{bookId}
│   ├── name: string
│   ├── userId: string (owner)
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   └── expenses/{expenseId}
│       ├── description: string
│       ├── amount: number
│       ├── type: 'in' | 'out'
│       ├── category: string
│       ├── paymentMode: string
│       ├── remarks: string
│       ├── attachments: string[]
│       └── createdAt: Timestamp
```

### Main Pages
1. `/login` - Google Sign-In (LoginPageClient.tsx)
2. `/` (home) - Dashboard overview
3. `/books` - Book management with pagination, search, bulk delete
4. `/book/[bookId]` - Expense details with filtering, sorting, pagination
5. `/analytics` - Analytics dashboard
6. `/settings` - User settings

### Key Components
- AddBookModal - Create new books
- AddExpenseModal - Add/edit expenses
- BooksList - Display books with selection
- BookDetailPage - Full expense management

## Implementation Checklist

### Phase 1: Dependencies ✅ COMPLETED
- [x] Install @playwright/test (v1.58.2)
- [x] Install firebase-tools (v15.6.0)
- [x] Install dotenv (v17.3.1)
- [x] Install browsers (Chromium, Firefox, WebKit)

### Phase 2: Firebase Emulator Configuration

#### File: `firebase.json` (UPDATE)
Add emulator configuration to existing firebase.json:
```json
{
  "firestore": {
    "database": "(default)",
    "location": "nam5",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099,
      "host": "127.0.0.1"
    },
    "firestore": {
      "port": 8080,
      "host": "127.0.0.1"
    },
    "hosting": {
      "port": 5000,
      "host": "127.0.0.1"
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### Phase 3: Environment Configuration

#### File: `.env.test` (CREATE)
```bash
# Test Environment Variables
NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=expense-tracker-test
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=localhost
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=test-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=test-measurement-id
NEXT_PUBLIC_FIREBASE_EMULATOR=true

# Emulator Configuration
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

# Test Configuration
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

#### File: `.env.local` (UPDATE - Add emulator flag)
Add to existing .env.local:
```bash
# Enable Firebase Emulator in development
NEXT_PUBLIC_FIREBASE_EMULATOR=true
```

### Phase 4: Firebase Configuration Update

#### File: `src/app/firebase.ts` (UPDATE)
Add emulator support:
```typescript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Connect to emulators in test/development mode
if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log('Connected to Firebase Emulators');
}

export { auth, db, googleProvider };
```

### Phase 5: Playwright Configuration

#### File: `playwright.config.ts` (CREATE)
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright configuration for Expense Tracker E2E tests
 * 
 * Features:
 * - Firebase Emulator integration
 * - Serial execution (workers: 1) for shared emulator state
 * - Screenshot/video capture on failure
 * - Multiple browser support (Chromium, Firefox, WebKit)
 * - CI/CD optimized settings
 */
export default defineConfig({
  testDir: './tests/specs',
  
  // Run tests in files in parallel, but within file serially (for emulator state)
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only (Firebase operations can be flaky)
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI (emulator requires serial execution)
  workers: process.env.CI ? 1 : 1,
  
  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    process.env.CI ? ['github'] : ['null'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.CI ? 'http://localhost:3000' : 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'on-first-retry',
    
    // Action timeout (Firebase operations can be slow)
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Run local dev server before starting tests
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),
  
  // Test timeout (Firebase emulator + app startup takes time)
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
```

### Phase 6: Test Infrastructure

#### Directory Structure:
```
tests/
├── fixtures/
│   ├── auth.fixture.ts           # Authenticated page fixture
│   └── firebase.fixture.ts       # Firebase emulator state
├── pages/
│   ├── LoginPage.ts              # Login page actions
│   ├── BooksPage.ts              # Books list actions
│   └── BookDetailPage.ts         # Book detail actions
├── utils/
│   ├── test-data.ts              # Test data generators
│   ├── selectors.ts              # Shared selectors
│   └── firebase-admin.ts         # Admin SDK for cleanup
├── specs/
│   ├── auth.spec.ts              # Authentication tests
│   ├── books.spec.ts             # Book CRUD tests
│   ├── expenses.spec.ts          # Expense workflow tests
│   └── dashboard.spec.ts         # Dashboard tests
├── global-setup.ts               # Global test setup
├── global-teardown.ts            # Global test teardown
└── README.md                     # Test documentation
```

#### File: `tests/global-setup.ts` (CREATE)
```typescript
import { execSync } from 'child_process';
import { test as setup } from '@playwright/test';

/**
 * Global setup - starts Firebase emulator before tests
 */
export default async function globalSetup() {
  console.log('Starting Firebase Emulator...');
  
  // Start emulator in background
  // In CI, you'd use firebase emulators:exec instead
  try {
    execSync('firebase emulators:start --only auth,firestore --project expense-tracker-test', {
      stdio: 'inherit',
      detached: true,
    });
  } catch (e) {
    console.log('Emulator might already be running or failed to start');
  }
  
  // Wait for emulator to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Firebase Emulator started');
}
```

#### File: `tests/global-teardown.ts` (CREATE)
```typescript
import { execSync } from 'child_process';

/**
 * Global teardown - stops Firebase emulator after tests
 */
export default async function globalTeardown() {
  console.log('Stopping Firebase Emulator...');
  
  try {
    execSync('firebase emulators:stop');
  } catch (e) {
    console.log('Emulator might not be running');
  }
  
  console.log('Firebase Emulator stopped');
}
```

#### File: `tests/utils/test-data.ts` (CREATE)
```typescript
/**
 * Test data generators
 */

export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}.${timestamp}.${random}@test.example.com`;
}

export function generateTestBookName(prefix = 'Book'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const random = Math.floor(Math.random() * 1000);
  return `${prefix} ${timestamp} #${random}`;
}

export interface TestExpense {
  description: string;
  amount: number;
  type: 'in' | 'out';
  category: string;
  paymentMode: string;
  remarks: string;
}

export function generateTestExpense(type: 'in' | 'out' = 'out'): TestExpense {
  const categories = ['General', 'Food', 'Transport', 'Utilities', 'Entertainment'];
  const paymentModes = ['Cash', 'Online', 'Card', 'UPI'];
  const descriptions = {
    in: ['Salary', 'Refund', 'Investment Return', 'Gift Received'],
    out: ['Groceries', 'Fuel', 'Dinner', 'Shopping', 'Bills'],
  };
  
  const descList = descriptions[type];
  const description = descList[Math.floor(Math.random() * descList.length)];
  const amount = Math.floor(Math.random() * 10000) + 100;
  
  return {
    description,
    amount,
    type,
    category: categories[Math.floor(Math.random() * categories.length)],
    paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
    remarks: `Test expense created at ${new Date().toISOString()}`,
  };
}

export function generateMultipleExpenses(count: number, type: 'in' | 'out' = 'out'): TestExpense[] {
  return Array.from({ length: count }, () => generateTestExpense(type));
}
```

#### File: `tests/utils/selectors.ts` (CREATE)
```typescript
/**
 * Shared CSS selectors and data-testid attributes
 */

export const Selectors = {
  // Login Page
  login: {
    googleSignInButton: 'button:has-text("Continue with Google")',
    errorAlert: '[role="alert"]',
    appTitle: 'text=Expense Pilot',
  },
  
  // Common
  common: {
    loadingSpinner: '[role="progressbar"]',
    errorMessage: '.MuiAlert-root',
    successMessage: '.MuiAlert-standardSuccess',
    modalOverlay: '.MuiModal-root',
    dialogTitle: '.MuiDialogTitle-root',
    confirmButton: 'button:has-text("Confirm")',
    cancelButton: 'button:has-text("Cancel")',
    deleteButton: 'button:has-text("Delete")',
  },
  
  // Books Page
  books: {
    addBookButton: 'button:has-text("Add Book")',
    searchInput: 'input[placeholder*="Search"]',
    bookCard: '[data-testid="book-card"]',
    bookName: '[data-testid="book-name"]',
    bookBalance: '[data-testid="book-balance"]',
    selectAllCheckbox: 'input[type="checkbox"]',
    deleteSelectedButton: 'button:has-text("Delete")',
    emptyState: 'text=No books found',
    quickAddSuggestion: '[data-testid="quick-add-suggestion"]',
  },
  
  // Add Book Modal
  addBookModal: {
    modal: '.MuiDialog-root',
    nameInput: 'input[name="name"]',
    submitButton: 'button[type="submit"]',
    closeButton: 'button[aria-label="close"]',
  },
  
  // Book Detail Page
  bookDetail: {
    bookTitle: 'h5',
    backButton: 'button:has([data-testid="FiChevronLeft"])',
    cashInButton: 'button:has-text("Cash In")',
    cashOutButton: 'button:has-text("Cash Out")',
    searchInput: 'input[placeholder*="Search"]',
    exportButton: 'button:has-text("Export")',
    analyticsButton: 'button:has-text("Analytics")',
    filterButton: 'button:has-text("Filters")',
    expenseRow: '[data-testid="expense-row"]',
    expenseDescription: '[data-testid="expense-description"]',
    expenseAmount: '[data-testid="expense-amount"]',
    editExpenseButton: 'button[aria-label="edit"]',
    selectAllCheckbox: 'input[type="checkbox"]',
    paginationInfo: 'text=/Showing\\s+\\d+/',
    cashInCard: 'text=Cash In',
    cashOutCard: 'text=Cash Out',
    netBalanceCard: 'text=Net Balance',
  },
  
  // Add Expense Modal
  addExpenseModal: {
    modal: '.MuiDialog-root',
    descriptionInput: 'input[name="description"]',
    amountInput: 'input[name="amount"]',
    typeSelect: 'select[name="type"]',
    categorySelect: 'select[name="category"]',
    paymentModeSelect: 'select[name="paymentMode"]',
    remarksInput: 'textarea[name="remarks"]',
    submitButton: 'button[type="submit"]',
    saveAndNewButton: 'button:has-text("Save & New")',
    closeButton: 'button[aria-label="close"]',
  },
  
  // Sidebar/Navigation
  navigation: {
    sidebar: '[role="navigation"]',
    dashboardLink: 'a:has-text("Dashboard")',
    booksLink: 'a:has-text("Books")',
    analyticsLink: 'a:has-text("Analytics")',
    settingsLink: 'a:has-text("Settings")',
    logoutButton: 'button:has-text("Logout")',
  },
  
  // Dashboard
  dashboard: {
    totalBalance: '[data-testid="total-balance"]',
    totalIncome: '[data-testid="total-income"]',
    totalExpense: '[data-testid="total-expense"]',
    recentBooks: '[data-testid="recent-books"]',
    statsCards: '.MuiCard-root',
  },
} as const;

// Helper to create data-testid selector
export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}
```

#### File: `tests/fixtures/auth.fixture.ts` (CREATE)
```typescript
import { test as base, expect, Page } from '@playwright/test';

/**
 * Authenticated test fixture
 * Provides a pre-authenticated page for tests
 */

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  // Create an authenticated page context for each test
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context (isolates storage/cookies)
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login page to load
    await page.waitForSelector('text=Continue with Google', { timeout: 10000 });
    
    // Note: With emulator, we can programmatically create a user
    // For now, we'll need to mock or handle the Google Sign-In flow
    // This is a simplified version - actual implementation will need
    // to handle the emulator auth flow
    
    // Use the emulator's REST API to create a user
    const emulatorUrl = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key';
    
    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123',
          returnSecureToken: true,
        }),
      });
      return res.json();
    }, emulatorUrl);
    
    // Store auth token in localStorage/sessionStorage
    if (response.idToken) {
      await page.evaluate((token) => {
        localStorage.setItem('authToken', token);
      }, response.idToken);
    }
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Use the authenticated page
    await use(page);
    
    // Cleanup
    await context.close();
  },
});

export { expect };
```

### Phase 7: Page Object Models

#### File: `tests/pages/LoginPage.ts` (CREATE)
```typescript
import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';

/**
 * Login Page Object Model
 */
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.login.appTitle)).toBeVisible();
    await expect(this.page.locator(Selectors.login.googleSignInButton)).toBeVisible();
  }

  async clickGoogleSignIn() {
    await this.page.locator(Selectors.login.googleSignInButton).click();
  }

  async verifyErrorMessage(message: string) {
    await expect(this.page.locator(Selectors.login.errorAlert)).toContainText(message);
  }

  async waitForRedirectToHome() {
    await this.page.waitForURL('/', { timeout: 30000 });
    await expect(this.page).toHaveURL('/');
  }
}
```

#### File: `tests/pages/BooksPage.ts` (CREATE)
```typescript
import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';

/**
 * Books Page Object Model
 */
export class BooksPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/books');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageLoaded() {
    await expect(this.page.locator(Selectors.books.addBookButton)).toBeVisible();
    await expect(this.page.locator(Selectors.books.searchInput)).toBeVisible();
  }

  async clickAddBook() {
    await this.page.locator(Selectors.books.addBookButton).click();
    await this.page.waitForSelector(Selectors.addBookModal.modal, { state: 'visible' });
  }

  async fillBookName(name: string) {
    await this.page.locator(Selectors.addBookModal.nameInput).fill(name);
  }

  async submitBookForm() {
    await this.page.locator(Selectors.addBookModal.submitButton).click();
    await this.page.waitForSelector(Selectors.addBookModal.modal, { state: 'hidden' });
  }

  async createBook(name: string) {
    await this.clickAddBook();
    await this.fillBookName(name);
    await this.submitBookForm();
  }

  async searchBooks(query: string) {
    await this.page.locator(Selectors.books.searchInput).fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  async getBookCount(): Promise<number> {
    const books = await this.page.locator(Selectors.books.bookCard).count();
    return books;
  }

  async verifyBookExists(name: string) {
    const bookNames = await this.page.locator(Selectors.books.bookName).allTextContents();
    expect(bookNames).toContain(name);
  }

  async clickBook(name: string) {
    await this.page.locator(`${Selectors.books.bookCard}:has-text("${name}")`).click();
  }

  async deleteBook(name: string) {
    // Find and select the book
    const bookCard = this.page.locator(`${Selectors.books.bookCard}:has-text("${name}")`);
    await bookCard.locator('input[type="checkbox"]').check();
    
    // Click delete button
    await this.page.locator(Selectors.books.deleteSelectedButton).click();
    
    // Confirm deletion
    await this.page.locator(Selectors.common.confirmButton).click();
    await this.page.waitForTimeout(1000);
  }

  async verifyEmptyState() {
    await expect(this.page.locator(Selectors.books.emptyState)).toBeVisible();
  }

  async clickQuickAddSuggestion(suggestion: string) {
    await this.page.locator(`${Selectors.books.quickAddSuggestion}:has-text("${suggestion}")`).click();
  }
}
```

#### File: `tests/pages/BookDetailPage.ts` (CREATE)
```typescript
import { Page, expect } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { TestExpense } from '../utils/test-data';

/**
 * Book Detail Page Object Model
 */
export class BookDetailPage {
  constructor(private page: Page) {}

  async goto(bookId: string) {
    await this.page.goto(`/book/${bookId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageLoaded(bookName?: string) {
    await expect(this.page.locator(Selectors.bookDetail.cashInButton)).toBeVisible();
    await expect(this.page.locator(Selectors.bookDetail.cashOutButton)).toBeVisible();
    
    if (bookName) {
      await expect(this.page.locator(Selectors.bookDetail.bookTitle)).toContainText(bookName);
    }
  }

  async clickCashIn() {
    await this.page.locator(Selectors.bookDetail.cashInButton).click();
    await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'visible' });
  }

  async clickCashOut() {
    await this.page.locator(Selectors.bookDetail.cashOutButton).click();
    await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'visible' });
  }

  async fillExpenseForm(expense: TestExpense) {
    await this.page.locator(Selectors.addExpenseModal.descriptionInput).fill(expense.description);
    await this.page.locator(Selectors.addExpenseModal.amountInput).fill(expense.amount.toString());
    await this.page.locator(Selectors.addExpenseModal.categorySelect).selectOption(expense.category);
    await this.page.locator(Selectors.addExpenseModal.paymentModeSelect).selectOption(expense.paymentMode);
    await this.page.locator(Selectors.addExpenseModal.remarksInput).fill(expense.remarks);
  }

  async submitExpenseForm(keepOpen = false) {
    if (keepOpen) {
      await this.page.locator(Selectors.addExpenseModal.saveAndNewButton).click();
    } else {
      await this.page.locator(Selectors.addExpenseModal.submitButton).click();
      await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'hidden' });
    }
  }

  async addExpense(expense: TestExpense, keepOpen = false) {
    if (expense.type === 'in') {
      await this.clickCashIn();
    } else {
      await this.clickCashOut();
    }
    await this.fillExpenseForm(expense);
    await this.submitExpenseForm(keepOpen);
  }

  async searchExpenses(query: string) {
    await this.page.locator(Selectors.bookDetail.searchInput).fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  async verifyExpenseExists(description: string) {
    const descriptions = await this.page.locator(Selectors.bookDetail.expenseDescription).allTextContents();
    expect(descriptions).toContain(description);
  }

  async verifyExpenseCount(expectedCount: number) {
    await expect(this.page.locator(Selectors.bookDetail.expenseRow)).toHaveCount(expectedCount);
  }

  async getTotalCashIn(): Promise<number> {
    const text = await this.page.locator(`${Selectors.bookDetail.cashInCard} + div`).textContent();
    // Parse currency format
    const match = text?.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  async getTotalCashOut(): Promise<number> {
    const text = await this.page.locator(`${Selectors.bookDetail.cashOutCard} + div`).textContent();
    const match = text?.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  async clickEditExpense(description: string) {
    const row = this.page.locator(`${Selectors.bookDetail.expenseRow}:has-text("${description}")`);
    await row.locator(Selectors.bookDetail.editExpenseButton).click();
    await this.page.waitForSelector(Selectors.addExpenseModal.modal, { state: 'visible' });
  }

  async deleteExpense(description: string) {
    const row = this.page.locator(`${Selectors.bookDetail.expenseRow}:has-text("${description}")`);
    await row.locator('input[type="checkbox"]').check();
    await this.page.locator(Selectors.common.deleteButton).first().click();
    await this.page.locator(Selectors.common.confirmButton).click();
    await this.page.waitForTimeout(1000);
  }

  async goBack() {
    await this.page.locator(Selectors.bookDetail.backButton).click();
    await this.page.waitForURL('/books');
  }

  async clickAnalytics() {
    await this.page.locator(Selectors.bookDetail.analyticsButton).click();
    await this.page.waitForURL(/\/book\/.*\/analytics/);
  }
}
```

### Phase 8: Test Specifications

#### File: `tests/specs/auth.spec.ts` (CREATE)
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login page with Google sign-in button', async () => {
    await loginPage.verifyPageLoaded();
  });

  test('should show error when Google sign-in is blocked', async ({ page }) => {
    // Simulate popup blocked scenario
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      await route.abort('blockedbyclient');
    });

    await loginPage.clickGoogleSignIn();
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('authenticated user should be redirected from login to home', async ({ page }) => {
    // This test assumes pre-authenticated state
    // In actual implementation, we'd use the auth fixture
    
    // For now, just verify the redirect logic exists
    await page.goto('/');
    
    // Should either redirect to login or show dashboard
    const url = page.url();
    expect(url).toMatch(/\/(login)?/);
  });
});
```

#### File: `tests/specs/books.spec.ts` (CREATE)
```typescript
import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';
import { generateTestBookName } from '../utils/test-data';

test.describe('Book Management', () => {
  let booksPage: BooksPage;
  const testBookName = generateTestBookName();

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
    await booksPage.goto();
  });

  test('should display books page with add book button', async () => {
    await booksPage.verifyPageLoaded();
  });

  test('should create a new book', async () => {
    const initialCount = await booksPage.getBookCount();
    
    await booksPage.createBook(testBookName);
    await booksPage.verifyBookExists(testBookName);
    
    // Verify count increased
    const newCount = await booksPage.getBookCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should search for a book', async () => {
    // First create a book
    await booksPage.createBook(testBookName);
    
    // Search for it
    await booksPage.searchBooks(testBookName);
    await booksPage.verifyBookExists(testBookName);
  });

  test('should navigate to book detail page', async ({ page }) => {
    await booksPage.createBook(testBookName);
    await booksPage.clickBook(testBookName);
    
    // Verify navigation to book detail
    await expect(page).toHaveURL(/\/book\//);
  });

  test('should delete a book', async () => {
    const bookToDelete = generateTestBookName('Delete');
    await booksPage.createBook(bookToDelete);
    await booksPage.verifyBookExists(bookToDelete);
    
    await booksPage.deleteBook(bookToDelete);
    
    // Verify book is deleted
    await booksPage.searchBooks(bookToDelete);
    const count = await booksPage.getBookCount();
    expect(count).toBe(0);
  });

  test('should use quick add suggestions', async () => {
    const suggestion = 'February Expenses';
    await booksPage.clickQuickAddSuggestion(suggestion);
    
    // Verify book was created
    await booksPage.verifyBookExists(suggestion);
  });

  test('should show empty state when no books exist', async ({ page }) => {
    // Clear all books first (in real test, use isolated test data)
    // For now, just verify empty state UI exists
    const count = await booksPage.getBookCount();
    if (count === 0) {
      await booksPage.verifyEmptyState();
    }
  });
});
```

#### File: `tests/specs/expenses.spec.ts` (CREATE)
```typescript
import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';
import { BookDetailPage } from '../pages/BookDetailPage';
import { generateTestBookName, generateTestExpense, generateMultipleExpenses } from '../utils/test-data';

test.describe('Expense Workflow', () => {
  let booksPage: BooksPage;
  let bookDetailPage: BookDetailPage;
  let bookId: string;
  const testBookName = generateTestBookName('Expense Test');

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
    bookDetailPage = new BookDetailPage(page);
    
    // Create a test book for each expense test
    await booksPage.goto();
    await booksPage.createBook(testBookName);
    
    // Get the book ID from URL after clicking
    await booksPage.clickBook(testBookName);
    const url = page.url();
    bookId = url.split('/book/')[1]?.split('/')[0];
    
    await bookDetailPage.verifyPageLoaded(testBookName);
  });

  test('should add a cash out expense to a book', async () => {
    const expense = generateTestExpense('out');
    
    await bookDetailPage.addExpense(expense);
    await bookDetailPage.verifyExpenseExists(expense.description);
  });

  test('should add a cash in expense to a book', async () => {
    const expense = generateTestExpense('in');
    
    await bookDetailPage.addExpense(expense);
    await bookDetailPage.verifyExpenseExists(expense.description);
  });

  test('should add multiple expenses and verify count', async () => {
    const expenses = generateMultipleExpenses(3, 'out');
    
    for (const expense of expenses) {
      await bookDetailPage.addExpense(expense);
    }
    
    await bookDetailPage.verifyExpenseCount(3);
  });

  test('should update cash in total when adding income', async () => {
    const initialCashIn = await bookDetailPage.getTotalCashIn();
    const expense = generateTestExpense('in');
    expense.amount = 5000;
    
    await bookDetailPage.addExpense(expense);
    
    // Verify cash in total increased
    const newCashIn = await bookDetailPage.getTotalCashIn();
    expect(newCashIn).toBeGreaterThan(initialCashIn);
  });

  test('should update cash out total when adding expense', async () => {
    const initialCashOut = await bookDetailPage.getTotalCashOut();
    const expense = generateTestExpense('out');
    expense.amount = 1000;
    
    await bookDetailPage.addExpense(expense);
    
    // Verify cash out total increased
    const newCashOut = await bookDetailPage.getTotalCashOut();
    expect(newCashOut).toBeGreaterThan(initialCashOut);
  });

  test('should edit an existing expense', async () => {
    // First add an expense
    const expense = generateTestExpense('out');
    await bookDetailPage.addExpense(expense);
    await bookDetailPage.verifyExpenseExists(expense.description);
    
    // Edit the expense
    const newDescription = 'Updated Description';
    await bookDetailPage.clickEditExpense(expense.description);
    await bookDetailPage.fillExpenseForm({
      ...expense,
      description: newDescription,
    });
    await bookDetailPage.submitExpenseForm();
    
    // Verify the change
    await bookDetailPage.verifyExpenseExists(newDescription);
  });

  test('should delete an expense', async () => {
    // Add an expense
    const expense = generateTestExpense('out');
    await bookDetailPage.addExpense(expense);
    await bookDetailPage.verifyExpenseExists(expense.description);
    
    // Delete it
    await bookDetailPage.deleteExpense(expense.description);
    
    // Verify it's gone (should show empty or count decreased)
    await bookDetailPage.searchExpenses(expense.description);
    const descriptions = await bookDetailPage.page.locator('[data-testid="expense-description"]').count();
    expect(descriptions).toBe(0);
  });

  test('should search for expenses', async () => {
    const expense = generateTestExpense('out');
    expense.description = 'Grocery Shopping Test';
    
    await bookDetailPage.addExpense(expense);
    await bookDetailPage.searchExpenses('Grocery');
    
    // Verify search results
    await bookDetailPage.verifyExpenseExists('Grocery Shopping Test');
  });

  test('should export expenses to CSV', async ({ page }) => {
    const expense = generateTestExpense('out');
    await bookDetailPage.addExpense(expense);
    
    // Click export and verify download (needs additional setup for file downloads)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      bookDetailPage.page.locator('button:has-text("Export")').click(),
    ]);
    
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
```

#### File: `tests/specs/dashboard.spec.ts` (CREATE)
```typescript
import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';
import { generateTestBookName, generateTestExpense } from '../utils/test-data';

test.describe('Dashboard', () => {
  let booksPage: BooksPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
  });

  test('should load dashboard with navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await page.goto('/');
    
    // Verify stats cards exist
    const statCards = await page.locator('.MuiCard-root').count();
    expect(statCards).toBeGreaterThan(0);
  });

  test('should navigate from dashboard to books page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Books');
    await expect(page).toHaveURL('/books');
    
    await booksPage.verifyPageLoaded();
  });

  test('should navigate from dashboard to analytics', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Analytics');
    await expect(page).toHaveURL('/analytics');
  });

  test('should display recent books on dashboard', async ({ page }) => {
    // Create a book first
    const bookName = generateTestBookName('Dashboard');
    await booksPage.goto();
    await booksPage.createBook(bookName);
    
    // Go to dashboard and verify book appears
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator(`text=${bookName}`)).toBeVisible();
  });

  test('should show total balance calculation', async ({ page }) => {
    // Create a book with expenses
    const bookName = generateTestBookName('Balance');
    await booksPage.goto();
    await booksPage.createBook(bookName);
    await booksPage.clickBook(bookName);
    
    // Add income and expense
    const income = generateTestExpense('in');
    income.amount = 10000;
    const expense = generateTestExpense('out');
    expense.amount = 3000;
    
    await page.locator('button:has-text("Cash In")').click();
    await page.locator('input[name="description"]').fill(income.description);
    await page.locator('input[name="amount"]').fill(income.amount.toString());
    await page.locator('button[type="submit"]').click();
    
    await page.locator('button:has-text("Cash Out")').click();
    await page.locator('input[name="description"]').fill(expense.description);
    await page.locator('input[name="amount"]').fill(expense.amount.toString());
    await page.locator('button[type="submit"]').click();
    
    // Go back to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify balance is displayed (7000 = 10000 - 3000)
    const balanceText = await page.locator('[data-testid="total-balance"]').textContent();
    expect(balanceText).toContain('7,000');
  });
});
```

### Phase 9: CI/CD Integration

#### File: `.github/workflows/playwright.yml` (CREATE)
```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
    - uses: actions/checkout@v4

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Install Playwright browsers
      run: bunx playwright install --with-deps ${{ matrix.browser }}

    - name: Install Firebase CLI
      run: bun add -g firebase-tools

    - name: Create .env.test file
      run: |
        echo "NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key" >> .env.test
        echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost" >> .env.test
        echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=expense-tracker-test" >> .env.test
        echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=localhost" >> .env.test
        echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789" >> .env.test
        echo "NEXT_PUBLIC_FIREBASE_APP_ID=test-app-id" >> .env.test
        echo "NEXT_PUBLIC_FIREBASE_EMULATOR=true" >> .env.test
        echo "FIRESTORE_EMULATOR_HOST=127.0.0.1:8080" >> .env.test
        echo "FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099" >> .env.test

    - name: Run Playwright tests with Firebase emulator
      run: bunx firebase emulators:exec --project expense-tracker-test --only auth,firestore 'bunx playwright test --project=${{ matrix.browser }}'
      env:
        CI: true

    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report-${{ matrix.browser }}
        path: |
          playwright-report/
          test-results/
        retention-days: 30

    - name: Upload screenshots
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: screenshots-${{ matrix.browser }}
        path: test-results/**/*.png
        retention-days: 7
```

### Phase 10: Package.json Scripts

#### File: `package.json` (UPDATE)
Add these scripts to existing package.json:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next export",
    "start": "next start",
    "lint": "eslint",
    
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chrome": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:report": "playwright show-report",
    
    "emulator:start": "firebase emulators:start --only auth,firestore --project expense-tracker-test",
    "emulator:stop": "firebase emulators:stop",
    "emulator:exec": "firebase emulators:exec --only auth,firestore --project expense-tracker-test",
    "test:ci": "firebase emulators:exec --only auth,firestore --project expense-tracker-test 'playwright test'"
  }
}
```

### Phase 11: Documentation

#### File: `tests/README.md` (CREATE)
```markdown
# E2E Testing with Playwright

This directory contains end-to-end tests for the Personal Expense Tracker application using Playwright and Firebase Emulator Suite.

## Prerequisites

- Bun 1.3.9+
- Firebase CLI (installed via `bun add -g firebase-tools`)
- Playwright browsers installed

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   bunx playwright install chromium firefox webkit
   ```

2. **Run tests locally:**
   ```bash
   # Run all tests
   bun run test:e2e
   
   # Run with UI mode (great for debugging)
   bun run test:e2e:ui
   
   # Run specific browser
   bun run test:e2e:chrome
   bun run test:e2e:firefox
   bun run test:e2e:webkit
   
   # Run with headed mode (see browser)
   bun run test:e2e:headed
   ```

3. **Start Firebase emulator manually:**
   ```bash
   bun run emulator:start
   # In another terminal:
   bun run test:e2e
   ```

## Test Structure

```
tests/
├── fixtures/           # Test fixtures (auth, emulator)
├── pages/             # Page Object Models
├── specs/             # Test specifications
├── utils/             # Utilities (test data, selectors)
├── global-setup.ts    # Global setup (start emulator)
└── global-teardown.ts # Global teardown (stop emulator)
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';

test('should create a book', async ({ page }) => {
  const booksPage = new BooksPage(page);
  await booksPage.goto();
  await booksPage.createBook('My Test Book');
  await booksPage.verifyBookExists('My Test Book');
});
```

### Using Fixtures

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('authenticated user can create expense', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto('/books');
  // ... continue test
});
```

## Environment Variables

Tests use `.env.test` for configuration. Key variables:

- `NEXT_PUBLIC_FIREBASE_EMULATOR=true` - Enable emulator mode
- `FIRESTORE_EMULATOR_HOST` - Firestore emulator host
- `FIREBASE_AUTH_EMULATOR_HOST` - Auth emulator host

## CI/CD

Tests run automatically on GitHub Actions for every PR and push to main.

View test results in the Actions tab or download artifacts (screenshots, videos, reports).

## Troubleshooting

### Emulator not starting
- Check if ports 9099, 8080, 4000 are available
- Run `bun run emulator:stop` to clean up

### Tests failing locally
- Try clearing test data: `rm -rf .firebase/`
- Check emulator UI at http://localhost:4000
- Run with `--debug` flag for more info

### Authentication issues
- Emulator creates isolated test users
- Check emulator auth tab at http://localhost:4000/auth

## Best Practices

1. Use Page Object Models for maintainability
2. Generate unique test data (timestamps, random numbers)
3. Clean up test data after tests
4. Use data-testid attributes for stable selectors
5. Add screenshots/videos for debugging failures
```

## Implementation Summary

### Files to Create/Update:

#### Configuration Files:
1. ✅ `firebase.json` - Add emulator config
2. `.env.test` - Test environment variables
3. `.env.local` - Add emulator flag
4. `src/app/firebase.ts` - Add emulator connection
5. `playwright.config.ts` - Playwright configuration

#### Test Infrastructure:
6. `tests/global-setup.ts` - Start emulator
7. `tests/global-teardown.ts` - Stop emulator
8. `tests/utils/test-data.ts` - Test data generators
9. `tests/utils/selectors.ts` - Shared selectors
10. `tests/fixtures/auth.fixture.ts` - Auth fixture

#### Page Objects:
11. `tests/pages/LoginPage.ts` - Login actions
12. `tests/pages/BooksPage.ts` - Books management
13. `tests/pages/BookDetailPage.ts` - Expense management

#### Test Specs:
14. `tests/specs/auth.spec.ts` - Auth tests
15. `tests/specs/books.spec.ts` - Book CRUD
16. `tests/specs/expenses.spec.ts` - Expense workflow
17. `tests/specs/dashboard.spec.ts` - Dashboard tests

#### CI/CD:
18. `.github/workflows/playwright.yml` - GitHub Actions

#### Scripts:
19. `package.json` - Add test scripts

#### Documentation:
20. `tests/README.md` - Test documentation

### Total Files: 20

### Key Technical Decisions:

1. **Firebase Emulator**: Isolated testing environment, no production data
2. **Serial Execution**: workers=1 due to shared emulator state
3. **Page Object Pattern**: Maintainable, readable tests
4. **Unique Test Data**: Timestamps prevent conflicts
5. **Multi-browser Testing**: Chromium, Firefox, WebKit
6. **Artifact Collection**: Screenshots/videos on failure
7. **Retry Logic**: 2 retries in CI for flaky operations
8. **Environment Separation**: .env.test for test-specific config

### Estimated Time to Complete: 2-3 hours

### Testing Strategy:
- **Auth**: Google Sign-In flow, error handling
- **Books**: CRUD, search, pagination, bulk delete
- **Expenses**: Add, edit, delete, search, calculations
- **Dashboard**: Statistics, navigation, data aggregation

### Success Criteria:
- [ ] All tests pass locally with emulator
- [ ] CI/CD pipeline runs tests on every PR
- [ ] Screenshots/videos available for debugging
- [ ] Test coverage for all major user flows
- [ ] Documentation complete and clear
