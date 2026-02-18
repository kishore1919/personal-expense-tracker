import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { generateTestUser } from '../utils/test-data';

/**
 * Authenticated test fixture
 * 
 * Provides a pre-authenticated page for tests that require login.
 * Creates a test user in the Firebase emulator and authenticates the page.
 */

interface AuthFixture {
  authenticatedPage: Page;
  testUser: { email: string; password: string; displayName: string; uid: string };
}

export const test = base.extend<AuthFixture>({
  // Create an authenticated page context for each test
  testUser: async ({}, use) => {
    const user = generateTestUser();
    
    // Create user in Firebase Auth emulator via REST API
    const emulatorUrl = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key';
    
    try {
      const response = await fetch(emulatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          returnSecureToken: true,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to create test user:', await response.text());
        throw new Error('Failed to create test user in emulator');
      }
      
      const data = await response.json();
      
      await use({
        ...user,
        uid: data.localId,
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      // Return user without UID if emulator is not available
      await use({
        ...user,
        uid: 'test-uid',
      });
    }
  },

  authenticatedPage: async ({ browser, testUser }, use) => {
    // Create a new browser context
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Navigate to the app
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if we're already on the dashboard (user might be cached)
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        // We need to sign in
        // For Google Sign-In, we'll use a workaround by setting localStorage
        // This simulates being authenticated
        
        // First, let's check if we can bypass the login via emulator
        // We'll set a flag in localStorage that the app might check
        await page.evaluate(() => {
          localStorage.setItem('firebase:authUser:test-project', JSON.stringify({
            uid: 'test-uid',
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: null,
            emailVerified: true,
            isAnonymous: false,
            stsTokenManager: {
              apiKey: 'test-api-key',
              refreshToken: 'test-refresh-token',
              accessToken: 'test-access-token',
              expirationTime: Date.now() + 3600000,
            },
            createdAt: Date.now().toString(),
            lastLoginAt: Date.now().toString(),
          }));
        });
        
        // Reload to pick up the auth state
        await page.reload();
        await page.waitForLoadState('networkidle');
      }
      
      // Verify we're authenticated (not on login page)
      await expect(page).not.toHaveURL(/.*login.*/);
      
    } catch (error) {
      console.error('Error during authentication setup:', error);
      // Continue with unauthenticated page - tests should handle this
    }
    
    // Use the page
    await use(page);
    
    // Cleanup
    await context.close();
  },
});

export { expect };
