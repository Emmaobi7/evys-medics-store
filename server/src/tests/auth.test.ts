/**
 * Evy's Projects — Authentication & Authorization Automated Test Suite
 *
 * Tests all required authentication scenarios:
 * 1. Login with valid credentials -> success (200)
 * 2. Login with invalid password -> 401
 * 3. Login with unknown email -> 401
 * 4. GET /api/v1/auth/me without token -> 401
 * 5. GET /api/v1/auth/me with valid admin token -> 200
 * 6. Admin endpoint (GET /api/v1/admin/orders) without token -> 401
 * 7. Admin endpoint with non-admin customer token -> 403
 * 8. Admin endpoint with valid admin token -> 200
 * 9. Admin endpoint with spoofed header/payload -> 401/403
 */

import { config } from '../config/env';

const BASE_URL = `http://localhost:${config.port}`;

interface TestResult {
  name: string;
  passed: boolean;
  status: number;
  expectedStatus: number;
  details?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING EVY\'S PROJECTS BACKEND AUTH TEST SUITE');
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log('====================================================\n');

  let adminToken = '';
  let customerToken = '';

  // --- Test 1: Login with valid admin credentials ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.auth.adminEmail,
        password: config.auth.adminPassword,
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && Boolean(data.token) && data.user?.role === 'ADMIN';
    if (passed) adminToken = data.token;

    results.push({
      name: '1. Login with valid admin credentials -> 200 & Token',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: passed ? `User: ${data.user?.email} (${data.user?.role})` : JSON.stringify(data),
    });
  } catch (err: any) {
    results.push({
      name: '1. Login with valid admin credentials',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 2: Login with valid customer credentials (for role testing) ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@clinic.co.uk',
        password: 'CustomerPass2026!',
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && Boolean(data.token) && data.user?.role === 'CUSTOMER';
    if (passed) customerToken = data.token;

    results.push({
      name: '2. Login with valid customer credentials -> 200 & Token',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: passed ? `User: ${data.user?.email} (${data.user?.role})` : JSON.stringify(data),
    });
  } catch (err: any) {
    results.push({
      name: '2. Login with valid customer credentials',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 3: Login with invalid password ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.auth.adminEmail,
        password: 'CompletelyWrongPassword999!',
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 401 && data.error === 'Invalid email or password.';

    results.push({
      name: '3. Login with invalid password -> 401 Unauthorized',
      passed,
      status: res.status,
      expectedStatus: 401,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '3. Login with invalid password',
      passed: false,
      status: 0,
      expectedStatus: 401,
      details: err.message,
    });
  }

  // --- Test 4: Login with unknown email ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent-user@nowhere.com',
        password: 'AnyPassword123!',
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 401 && data.error === 'Invalid email or password.';

    results.push({
      name: '4. Login with unknown email -> 401 Unauthorized (No email leak)',
      passed,
      status: res.status,
      expectedStatus: 401,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '4. Login with unknown email',
      passed: false,
      status: 0,
      expectedStatus: 401,
      details: err.message,
    });
  }

  // --- Test 5: /auth/me without token ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`);
    const data = (await res.json()) as any;
    const passed = res.status === 401;

    results.push({
      name: '5. GET /api/v1/auth/me without token -> 401 Unauthorized',
      passed,
      status: res.status,
      expectedStatus: 401,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '5. GET /api/v1/auth/me without token',
      passed: false,
      status: 0,
      expectedStatus: 401,
      details: err.message,
    });
  }

  // --- Test 6: /auth/me with valid admin token ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && data.user?.role === 'ADMIN';

    results.push({
      name: '6. GET /api/v1/auth/me with valid admin token -> 200 OK',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: `Profile: ${data.user?.email} (${data.user?.role})`,
    });
  } catch (err: any) {
    results.push({
      name: '6. GET /api/v1/auth/me with valid admin token',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 7: Admin endpoint without token ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/orders`);
    const data = (await res.json()) as any;
    const passed = res.status === 401;

    results.push({
      name: '7. GET /api/v1/admin/orders without token -> 401 Unauthorized',
      passed,
      status: res.status,
      expectedStatus: 401,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '7. GET /api/v1/admin/orders without token',
      passed: false,
      status: 0,
      expectedStatus: 401,
      details: err.message,
    });
  }

  // --- Test 8: Admin endpoint with customer token (Role Forbidden) ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 403;

    results.push({
      name: '8. GET /api/v1/admin/orders with customer token -> 403 Forbidden',
      passed,
      status: res.status,
      expectedStatus: 403,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '8. GET /api/v1/admin/orders with customer token',
      passed: false,
      status: 0,
      expectedStatus: 403,
      details: err.message,
    });
  }

  // --- Test 9: Admin endpoint with valid admin token ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && Array.isArray(data.orders);

    results.push({
      name: '9. GET /api/v1/admin/orders with admin token -> 200 OK',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: `Retrieved ${data.orders?.length ?? 0} orders successfully`,
    });
  } catch (err: any) {
    results.push({
      name: '9. GET /api/v1/admin/orders with admin token',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 10: Security check - Spoofed Authorization Header ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/products`, {
      headers: { Authorization: 'Bearer forged.fake.jwt.token.signature' },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 401;

    results.push({
      name: '10. Request with forged JWT token -> 401 Unauthorized',
      passed,
      status: res.status,
      expectedStatus: 401,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '10. Request with forged JWT token',
      passed: false,
      status: 0,
      expectedStatus: 401,
      details: err.message,
    });
  }

  // --- Print Summary ---
  console.log('\n====================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('====================================================\n');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${r.name}`);
    if (r.details) {
      console.log(`       ↳ ${r.details}`);
    }
    if (!r.passed) allPassed = false;
  }

  console.log('\n====================================================');
  const passCount = results.filter((r) => r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${results.length - passCount}`);
  console.log('====================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
