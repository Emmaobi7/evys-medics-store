/**
 * Evy's Projects — Paystack Payment & Webhook Automated Test Suite
 *
 * Covers:
 * 1. Initialize Paystack transaction with authoritative order amount
 * 2. Reject initialization for nonexistent order (404)
 * 3. Verify Paystack transaction updates payment and order to 'paid'
 * 4. Duplicate verification is idempotent and returns already-paid status
 * 5. Webhook rejects invalid HMAC SHA512 signature (401)
 * 6. Webhook processes valid 'charge.success' and marks order paid (200)
 */

import crypto from 'crypto';
import { config } from '../config/env';
import { query, pool } from '../db/connection';

const BASE_URL = `http://localhost:${config.port}`;

interface TestResult {
  name: string;
  passed: boolean;
  status: number;
  expectedStatus: number;
  details?: string;
}

const results: TestResult[] = [];

async function runPaystackTests() {
  console.log('====================================================');
  console.log('💳 RUNNING PAYSTACK & COMMERCE AUTOMATED TEST SUITE');
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log('====================================================\n');

  // Find a product to create a test order
  const prodRes = await query<any>(
    'SELECT id, sku, name, price_ex_vat FROM products WHERE is_active = TRUE ORDER BY id ASC LIMIT 1;'
  );

  if (prodRes.rows.length === 0) {
    console.error('❌ No active products found in database.');
    process.exit(1);
  }

  const testProduct = prodRes.rows[0];
  await query('UPDATE inventory SET stock_count = 50 WHERE product_id = $1;', [testProduct.id]);

  // Create an order for testing payment
  const orderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Amina Bello',
      customerEmail: 'amina.bello@clinic.ng',
      customerPhone: '08012345678',
      clinicName: 'Lagos Specialist Hospital',
      paymentMethod: 'paystack',
      shippingAddressLine1: '14 Victoria Island Road',
      shippingCity: 'Lagos',
      shippingPostcode: '101241',
      items: [{ productId: testProduct.id, quantity: 2 }],
    }),
  });

  const orderData = (await orderRes.json()) as any;
  const testOrderId = orderData.order.id;
  const authoritativeTotal = Number(orderData.order.total);

  console.log(`📦 Created Test Order: ${orderData.order.orderNumber} (Total: ₦${authoritativeTotal})`);

  // --- Test 1: Initialize Paystack transaction ---
  let paymentReference = '';
  try {
    const res = await fetch(`${BASE_URL}/api/v1/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId,
      }),
    });
    const data = (await res.json()) as any;
    paymentReference = data.reference;

    const passed =
      res.status === 200 &&
      Boolean(data.authorizationUrl) &&
      Boolean(data.reference) &&
      data.currency === 'NGN' &&
      Math.abs(Number(data.amount) - authoritativeTotal) < 0.01;

    results.push({
      name: '1. Initialize Paystack payment with server-authoritative amount',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: passed
        ? `Ref: ${data.reference}, Amount: ₦${data.amount}, Currency: ${data.currency}`
        : JSON.stringify(data),
    });
  } catch (err: any) {
    results.push({
      name: '1. Initialize Paystack payment',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 2: Reject payment initialization on nonexistent order ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'nonexistent-order-id-0000',
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 404;

    results.push({
      name: '2. Reject payment initialization for nonexistent order -> 404 Not Found',
      passed,
      status: res.status,
      expectedStatus: 404,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '2. Reject nonexistent order',
      passed: false,
      status: 0,
      expectedStatus: 404,
      details: err.message,
    });
  }

  // --- Test 3: Verify Paystack transaction -> Marks order and payment 'paid' ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/payments/verify/${paymentReference}`);
    const data = (await res.json()) as any;

    const passed =
      res.status === 200 &&
      data.success === true &&
      data.status === 'paid';

    results.push({
      name: '3. Server verifies Paystack reference -> Updates status to paid',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: `Success: ${data.success}, Status: ${data.status}, Order: ${data.orderNumber}`,
    });
  } catch (err: any) {
    results.push({
      name: '3. Verify Paystack transaction',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 4: Idempotent duplicate verification ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/payments/verify/${paymentReference}`);
    const data = (await res.json()) as any;

    const passed = res.status === 200 && data.status === 'paid' && data.success === true;

    results.push({
      name: '4. Duplicate verification is safe & idempotent',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: `Message: ${data.message}, Status: ${data.status}`,
    });
  } catch (err: any) {
    results.push({
      name: '4. Duplicate verification',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 5: Webhook rejects invalid signature ---
  try {
    const webhookPayload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: paymentReference,
        status: 'success',
        amount: Math.round(authoritativeTotal * 100),
        currency: 'NGN',
      },
    });

    const res = await fetch(`${BASE_URL}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'fake-invalid-signature-12345',
      },
      body: webhookPayload,
    });

    const data = (await res.json()) as any;
    const passed = res.status === 401;

    results.push({
      name: '5. Webhook rejects invalid HMAC SHA512 signature -> 401 Unauthorized',
      passed,
      status: res.status,
      expectedStatus: 401,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '5. Webhook invalid signature',
      passed: false,
      status: 0,
      expectedStatus: 401,
      details: err.message,
    });
  }

  // --- Test 6: Webhook accepts valid signature & processes event ---
  try {
    const webhookPayload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: paymentReference,
        status: 'success',
        amount: Math.round(authoritativeTotal * 100),
        currency: 'NGN',
        paid_at: new Date().toISOString(),
      },
    });

    // Compute real HMAC SHA512 signature with configured secret
    const signature = crypto
      .createHmac('sha512', config.paystack.secretKey)
      .update(webhookPayload)
      .digest('hex');

    const res = await fetch(`${BASE_URL}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': signature,
      },
      body: webhookPayload,
    });

    const data = (await res.json()) as any;
    const passed = res.status === 200 && data.status === true;

    results.push({
      name: '6. Webhook verifies valid HMAC SHA512 signature -> 200 OK & processes event',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: `Status: ${res.status}, Response: ${JSON.stringify(data)}`,
    });
  } catch (err: any) {
    results.push({
      name: '6. Webhook valid signature',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Print Summary ---
  console.log('\n====================================================');
  console.log('📊 PAYSTACK TEST RESULTS SUMMARY');
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

  await pool.end();

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPaystackTests();
