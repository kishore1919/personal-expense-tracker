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
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory containing test files
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
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'on-first-retry',
    
    // Action timeout (Firebase operations can be slow)
    actionTimeout: parseInt(process.env.ACTION_TIMEOUT || '15000'),
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Storage state (for authentication persistence)
    storageState: undefined,
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile browsers (optional, can be enabled for mobile testing)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
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
  timeout: parseInt(process.env.TEST_TIMEOUT || '60000'),
  
  // Expect timeout
  expect: {
    timeout: parseInt(process.env.EXPECT_TIMEOUT || '10000'),
  },
  
  // Output directory for test results
  outputDir: 'test-results/',
});
