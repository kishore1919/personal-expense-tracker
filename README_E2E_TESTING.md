# End-to-End Testing Rewrite Plan for Expense Pilot

**Objective:**  
Modernize and expand the Playwright E2E test suite to achieve full feature coverage, improve reliability, and enable continuous testing.

---

## 1. Current State

### 1.1 Configuration (`playwright.config.ts`)
- Test directory: `./tests/specs`
- Execution: Serial (`workers: 1`) for Firebase emulator stability
- Parallelism: `fullyParallel: false`
- Retries: 2 on CI
- Base URL: `http://localhost:3000` (configurable)
- Browsers: Chromium, Firefox, WebKit
- Timeouts: Action 15s, Nav 30s, Test 60s, Expect 10s
- Artifacts: Screenshots, videos, traces on failure
- Auto-start dev server
- Global setup/teardown for Firebase emulators

### 1.2 Test Coverage (36 tests)
| File | Tests | Features Covered |
|------|-------|------------------|
| `auth.spec.ts` | 5 | Login page, Google sign‑in, branding, navigation |
| `books.spec.ts` | 11 | Book CRUD, search, sorting, pagination, quick‑add |
| `expenses.spec.ts` | 11 | Expense creation, totals, search, navigation |
| `dashboard.spec.ts` | 9 | Navigation, stats cards, responsive layout |

### 1.3 Test Architecture
- **Page Object Model (POM)**: `tests/pages/`
- **Fixtures**: Authenticated page with Firebase user creation
- **Test Data**: Generators in `tests/utils/test-data.ts`
- **Selectors**: Centralized in `tests/utils/selectors.ts`
- **Auth**: Firebase emulator integration
- **Global Setup/Teardown**: Starts/stops Firebase Auth/Firestore emulators

### 1.4 Missing Coverage
- Analytics pages (`/analytics`, `/book/[bookId]/analytics`)
- Settings page (`/settings`)
- Budget, Investments, Loans, Subscriptions
- Expense CRUD (edit/delete), book edit/delete/archive
- Visual regression, accessibility, performance tests
- No visual/a11y/perf tests

---

## 2. Enhancements Overview

### 2.1 New Page Objects
Create comprehensive page objects:
- `AnalyticsPage.ts`
- `SettingsPage.ts`
- `BudgetPage.ts`
- `LoansPage.ts`
- `SubscriptionsPage.ts`
- `InvestmentsPage.ts`

### 2.2 Extended Utilities
- `test-data.ts`: Generators for loans, budgets, subscriptions, etc.
- `helpers.ts`: Common actions (`waitForNetworkIdle`, `clearAndType`, `clickWithRetry`)
- `constants.ts`: Timeouts, retry counts, default data

### 2.3 Enhanced Fixtures
- Data seeding fixtures (create test book with expenses)
- Cleanup fixtures (delete test data)
- Mobile viewport fixture
- Dynamic auth fixture (custom user credentials)

### 2.4 Visual Regression
- Add `tests/visual/` specs with `playwright expect(page).toHaveScreenshot()`
- Configure HTML report generation

### 2.5 Accessibility & Performance
- Axe accessibility scanning integration
- Performance timing measurements
- Resource load audits

---

## 3. Implementation Timeline (5 Weeks)

| Week | Focus | Target Deliverables |
|------|-------|---------------------|
| **Week 1** | Infrastructure | Enhanced page objects, utilities, fixtures, visual regression setup |
| **Week 2** | Rewrite Existing | Improve reliability, readability, expand coverage of books & expenses CRUD |
| **Week 3** | New Features | Add specs for Analytics, Settings, Loans, Subscriptions, Budget |
| **Week 4** | Advanced Tests | Axe accessibility, performance, API integration tests |
| **Week 5** | Quality & Tagging | Flakiness fixes, test tags (`@smoke`, `@crud`), documentation |

---

## 4. Updated Test Structure

```
tests/
├── fixtures/
│   ├── auth.fixture.ts
│   └── data.fixture.ts            # NEW
├── pages/
│   ├── LoginPage.ts
│   ├── BooksPage.ts
│   ├── BookDetailPage.ts
│   ├── AnalyticsPage.ts           # NEW
│   ├── SettingsPage.ts            # NEW
│   ├── BudgetPage.ts              # NEW
│   ├── LoansPage.ts               # NEW
│   ├── SubscriptionsPage.ts       # NEW
│   └── InvestmentsPage.ts         # NEW
├── specs/
│   ├── auth.spec.ts
│   ├── books.spec.ts              # Enhanced
│   ├── expenses.spec.ts           # Enhanced
│   ├── dashboard.spec.ts          # Enhanced
│   ├── analytics.spec.ts          # NEW
│   ├── settings.spec.ts           # NEW
│   ├── loans.spec.ts              # NEW
│   ├── subscriptions.spec.ts      # NEW
│   ├── budget.spec.ts             # NEW
│   ├── visual/                    # NEW
│   │   └── homepage.spec.ts       # NEW visual regression
│   ├── a11y/                      # NEW
│   │   └── accessibility.spec.ts  # NEW a11y scans
│   └── api/                       # NEW
│       └── firebase.spec.ts       # NEW API tests
├── utils/
│   ├── test-data.ts               # Expanded
│   ├── selectors.ts
│   ├── helpers.ts                 # NEW
│   └── constants.ts               # NEW
├── global-setup.ts
├── global-teardown.ts
└── playwright.config.ts          # Enhanced
```

---

## 5. New Spec Examples

### **analytics.spec.ts**
```ts
test.describe('Analytics Page', () => {
  test('should display expense breakdown chart', async ({ analyticsPage }) => {
    await analyticsPage.goto();
    await expect(analyticsPage.expenseChart).toBeVisible();
  });

  test('should filter analytics by date range', async ({ analyticsPage }) => {
    await analyticsPage.filterByDate('last-30-days');
    await expect(analyticsPage.filteredChart).toBeVisible();
  });
});
```

### **settings.spec.ts**
```ts
test.describe('Settings Page', () => {
  test('should change currency', async ({ settingsPage }) => {
    await settingsPage.changeCurrency('INR');
    expect(settingsPage.currencyDisplay).toBe('₹');
  });

  test('should toggle dark mode', async ({ settingsPage }) => {
    await settingsPage.toggleDarkMode();
    expect(settingsPage.body).toHaveClass('dark');
  });
});
```

### **loans.spec.ts**
```ts
test.describe('Loans Management', () => {
  test('should create a new loan', async ({ loansPage }) => {
    await loansPage.open();
    await loansPage.addLoan({ name: 'Learning Loan', amount: 500 });
    expect(loansPage.loanRow('Learning Loan')).toBeVisible();
  });

  test('should edit loan details', async ({ loansPage }) => {
    await loansPage.editLoan('Learning Loan', { amount: 600 });
    expect(loansPage.loanAmount('Learning Loan')).toBe('₹600');
  });
});
```

---

## 6. Quality Improvements

- **Flakiness Reduction**
  - Add `data-testid` attributes everywhere
  - Use `waitFor` with custom retry logic
  - Implement isolated test data (unique timestamps)

- **Test Tagging**
  - `@smoke`, `@crud`, `@analytics`, `@settings`
  - Run subsets: `playwright test --grep @smoke`

- **Improved Error Messages**
  - Include descriptive messages in assertions

- **Documentation**
  - Update README with test run commands
  - Add contribution guide for new specs

---

## 7. Git Hooks (Pre‑Commit)

Add to `.git/hooks/pre-commit`:
```sh
#!/bin/sh
npm run lint && npm run typecheck && npm run build
npm run test:e2e -- --coverage
exit $?
```

---

## 8. Success Criteria

| Metric | Target |
|--------|--------|
| Total Tests | 60–80 |
| Feature Coverage | 100% of application routes |
| Flakiness Rate | < 2% |
| Test Execution Time | < 10 min (CI) |
| Visual Regression Baseline | Updated weekly |
| Axe Violations | 0 critical issues |
| Performance Budgets Met | 90%+ compliance |

---

### **Conclusion**
This plan brings the E2E suite in line with modern testing practices, ensures comprehensive feature coverage, and lays a solid foundation for future enhancements. Execution begins next week with infrastructure work, followed by iterative improvements as described.

--- 

*Prepared by the development team – ready for review.*  