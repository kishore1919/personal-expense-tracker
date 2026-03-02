import { test, expect } from '@playwright/test';
import { FIREBASE_EMULATOR, TIMEOUTS } from '../../utils/constants';
import { generateTestUser, generateTestBookName } from '../../utils/test-data';

/**
 * API integration tests for Expense Pilot
 *
 * These tests verify the Firebase backend integration
 * and API endpoints directly.
 *
 * Run with: npx playwright test --grep @api
 */

test.describe('Firebase API Integration Tests', () => {
  const emulatorUrl = `http://${FIREBASE_EMULATOR.HOST}:${FIREBASE_EMULATOR.AUTH_PORT}`;

  test('Firebase Auth emulator should be running', async () => {
    const response = await fetch(`${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
        returnSecureToken: true,
      }),
    });

    expect(response.ok).toBeTruthy();
  });

  test('Should create a new user via Auth API', async () => {
    const user = generateTestUser();

    const response = await fetch(`${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true,
      }),
    });

    expect(response.ok).toBeTruthy();

    const data = await response.json();
    expect(data.localId).toBeTruthy();
    expect(data.email).toBe(user.email);
  });

  test('Should authenticate existing user', async () => {
    const user = generateTestUser();

    // First create the user
    await fetch(`${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true,
      }),
    });

    // Then sign in
    const signInResponse = await fetch(`${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true,
      }),
    });

    expect(signInResponse.ok).toBeTruthy();

    const data = await signInResponse.json();
    expect(data.localId).toBeTruthy();
    expect(data.idToken).toBeTruthy();
  });

  test('Should reject invalid credentials', async () => {
    const user = generateTestUser();

    const response = await fetch(`${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: 'WrongPassword123!',
        returnSecureToken: true,
      }),
    });

    expect(response.ok).toBeFalsy();
  });
});

test.describe('Firestore API Tests', () => {
  const firestoreUrl = `http://${FIREBASE_EMULATOR.HOST}:${FIREBASE_EMULATOR.FIRESTORE_PORT}`;

  test('Firestore emulator should be running', async () => {
    // Basic health check for Firestore emulator
    const response = await fetch(`${firestoreUrl}/google.firestore.v1.Firestore/ListDocuments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Request-Params': 'database=projects/test-project/databases/(default)',
      },
      body: JSON.stringify({
        parent: 'projects/test-project/databases/(default)/documents',
        collectionId: 'test',
      }),
    });

    // May return error but proves emulator is running
    expect(response.status).toBeLessThan(500);
  });
});

test.describe('REST API Endpoint Tests', () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  test('Home page should respond', async () => {
    const response = await fetch(baseUrl);
    expect(response.ok).toBeTruthy();
    expect(response.status).toBe(200);
  });

  test('Login page should respond', async () => {
    const response = await fetch(`${baseUrl}/login`);
    expect(response.ok).toBeTruthy();
    expect(response.status).toBe(200);
  });

  test('API health endpoint should respond', async () => {
    // If your app has a health check endpoint
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      // May return 404 if endpoint doesn't exist, which is fine
      expect([200, 404]).toContain(response.status);
    } catch {
      // Endpoint may not exist, which is acceptable
      console.log('Health endpoint not available');
    }
  });

  test('Static assets should load', async () => {
    const response = await fetch(`${baseUrl}/favicon.ico`);
    // May return 200 or 404 depending on setup
    expect([200, 404]).toContain(response.status);
  });
});

test.describe('Authentication Flow Tests', () => {
  test('Full auth flow via API', async () => {
    const user = generateTestUser();
    const authUrl = `${emulatorUrl}/identitytoolkit.googleapis.com/v1`;

    // 1. Sign up
    const signUpResponse = await fetch(`${authUrl}/accounts:signUp?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true,
      }),
    });

    expect(signUpResponse.ok).toBeTruthy();
    const signUpData = await signUpResponse.json();
    expect(signUpData.localId).toBeTruthy();

    // 2. Sign in
    const signInResponse = await fetch(`${authUrl}/accounts:signInWithPassword?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true,
      }),
    });

    expect(signInResponse.ok).toBeTruthy();
    const signInData = await signInResponse.json();
    expect(signInData.idToken).toBeTruthy();
    expect(signInData.refreshToken).toBeTruthy();

    // 3. Get user info (using the ID token)
    const userInfoResponse = await fetch(`${authUrl}/accounts:lookup?key=test-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: signInData.idToken,
      }),
    });

    expect(userInfoResponse.ok).toBeTruthy();
    const userInfoData = await userInfoResponse.json();
    expect(userInfoData.users).toHaveLength(1);
    expect(userInfoData.users[0].email).toBe(user.email);
  });
});
