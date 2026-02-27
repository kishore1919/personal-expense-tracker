# E2E Testing with Playwright

This directory contains end-to-end tests for the Personal Expense Tracker application using Playwright and Firebase Emulator Suite.

## Overview

The E2E test suite provides comprehensive testing of user flows including:
- User authentication (Google Sign-In)
- Book management (create, search, delete)
- Expense tracking (add, edit, delete income/expenses)
- Dashboard functionality

## Prerequisites

- **Bun** 1.3.9+ (or Node.js 18+)
- **Firebase CLI** (installed automatically with `bun install`)
- **Playwright browsers** (installed via post-install hook)

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

This will automatically:
- Install all npm packages
- Install Playwright browsers (Chromium, Firefox, WebKit)
- Install Firebase CLI locally

### 2. Run Tests

```bash
# Run all tests
bun run test:e2e

# Run with UI mode (interactive debugging)
bun run test:e2e:ui

# Run in headed mode (see browser windows)
bun run test:e2e:headed

# Run specific browser
bun run test:e2e:chrome
bun run test:e2e:firefox
bun run test:e2e:webkit

# Debug mode with step-through
bun run test:e2e:debug
```

### 3. Start Firebase Emulator Manually (Optional)

If you want to run the emulator separately:

```bash
# Start emulator
bun run emulator:start

# In another terminal, run tests
bun run test:e2e

# Stop emulator when done
bun run emulator:stop
```

## Test Structure

```
tests/
├── fixtures/
│   └── auth.fixture.ts          # Authenticated page fixture
├── pages/
│   ├── LoginPage.ts             # Login page POM
│   ├── BooksPage.ts             # Books list POM
│   └── BookDetailPage.ts        # Book detail POM
├── specs/
│   ├── auth.spec.ts             # Authentication tests
│   ├── books.spec.ts            # Book management tests
│   ├── expenses.spec.ts         # Expense workflow tests
│   └── dashboard.spec.ts        # Dashboard tests
├── utils/
│   ├── test-data.ts             # Test data generators
│   └── selectors.ts             # Shared CSS selectors
├── global-setup.ts              # Global test setup
├── global-teardown.ts           # Global test teardown
└── README.md                    # This file
```

## Architecture

### Page Object Model (POM)

Tests use the Page Object Model pattern for maintainability:

```typescript
// Example usage
import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';

test('should create a book', async ({ page }) => {
  const booksPage = new BooksPage(page);
  await booksPage.goto();
  await booksPage.createBook('My Test Book');
  await booksPage.verifyBookExists('My Test Book');
});
```

### Firebase Emulator

Tests run against Firebase Emulator Suite for isolated testing:
- **Auth Emulator**: Port 9099
- **Firestore Emulator**: Port 8080
- **Emulator UI**: Port 4000

This ensures:
- No production data is affected
- Tests can run in parallel (serial execution for emulator state)
- Fast, local database operations
- Reproducible test environments

### Test Data

Use utility functions for generating unique test data:

```typescript
import { generateTestBookName, generateTestExpense } from '../utils/test-data';

const bookName = generateTestBookName();  // "Book 2024-02-17 #123"
const expense = generateTestExpense('out'); // Random expense data
```

## Writing Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import { BooksPage } from '../pages/BooksPage';
import { generateTestBookName } from '../utils/test-data';

test.describe('Feature Name', () => {
  let booksPage: BooksPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
    await booksPage.goto();
  });

  test('should do something', async () => {
    // Arrange
    const bookName = generateTestBookName();
    
    // Act
    await booksPage.createBook(bookName);
    
    // Assert
    await booksPage.verifyBookExists(bookName);
  });
});
```

### Using Fixtures

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('authenticated user can access protected page', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto('/books');
  // ... continue test
});
```

### Best Practices

1. **Use Page Objects**: Keep selectors in POMs, not tests
2. **Generate Unique Data**: Use `generateTestBookName()`, `generateTestExpense()`
3. **Wait for Elements**: Use Playwright's auto-waiting or explicit waits
4. **Clean State**: Tests are independent, create your own data
5. **Add Timeouts**: Firebase operations can be slow

## Configuration

### Environment Variables

Tests use `.env.test` for configuration:

```bash
NEXT_PUBLIC_FIREBASE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

### Playwright Configuration

See `playwright.config.ts` for:
- Browser settings
- Timeout values
- Screenshot/video capture settings
- Parallel execution settings

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`

GitHub Actions workflow (`.github/workflows/playwright.yml`):
- Runs tests on Chromium, Firefox, and WebKit
- Uses Firebase Emulator in CI
- Uploads test results and screenshots as artifacts
- Posts test results as PR comments

## Troubleshooting

### Emulator Won't Start

```bash
# Check if ports are in use
lsof -i :9099  # Auth
lsof -i :8080  # Firestore

# Kill existing processes or use different ports
bun run emulator:stop
```

### Tests Timeout

Firebase emulator startup can be slow. Increase timeouts in `.env.test`:

```bash
TEST_TIMEOUT=120000
EXPECT_TIMEOUT=15000
```

### Tests Fail Intermittently

- Check emulator is running: http://localhost:4000
- Increase retry count: `--retries=3`
- Run in headed mode to see what's happening: `bun run test:e2e:headed`

### Authentication Issues

The app uses Google Sign-In. Tests handle this by:
1. Creating test users via Auth Emulator REST API
2. Setting localStorage auth tokens
3. Bypassing the actual OAuth flow

### Screenshot/Video Capture

Artifacts are automatically captured on failure:

```bash
# View report
bun run test:e2e:report

# Or check test-results/ directory
ls test-results/
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun run test:e2e` | Run all tests |
| `bun run test:e2e:ui` | Interactive UI mode |
| `bun run test:e2e:headed` | See browser windows |
| `bun run test:e2e:debug` | Step-through debugging |
| `bun run test:e2e:chrome` | Chromium only |
| `bun run test:e2e:firefox` | Firefox only |
| `bun run test:e2e:webkit` | WebKit only |
| `bun run test:e2e:report` | Show HTML report |
| `bun run emulator:start` | Start Firebase emulator |
| `bun run emulator:stop` | Stop Firebase emulator |
| `bun run test:ci` | Run with emulator (CI mode) |

## Contributing

When adding new tests:

1. Create/update Page Object Models for new features
2. Use `generateTest*()` functions for unique data
3. Add tests to appropriate `specs/*.spec.ts` file
4. Update this README if needed
5. Run `bun run lint` to check code quality

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

## License

Same as the main project (see root LICENSE file).
