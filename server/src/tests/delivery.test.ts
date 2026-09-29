/**
 * Evy's Projects — Admin Delivery Fee Management Automated Test Suite
 *
 * Covers:
 * 1. Default delivery fee on newly placed order
 * 2. Admin can update delivery fee on pending order -> Recalculates total server-side
 * 3. Negative delivery fee rejected (400)
 * 4. Non-admin request rejected (401/403)
 * 5. Paid order rejects delivery fee modification (400)
 */

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

async function runDeliveryTests() {
  console.log('====================================================');
  console.log('🚚 RUNNING ADMIN DELIVERY MANAGEMENT TEST SUITE');
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log('====================================================\n');

  // 1. Authenticate as admin
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: config.auth.adminEmail,
      password: config.auth.adminPassword,
    }),
  });

  const loginData = (await loginRes.json()) as any;
  const adminToken = loginData.token;

  if (!adminToken) {
    console.error('❌ Could not login as admin. Ensure admin user exists.');
    process.exit(1);
  }

  // 2. Find a product & create pending order
  const prodRes = await query<any>(
    'SELECT id, sku, name, price_ex_vat FROM products WHERE is_active = TRUE ORDER BY id ASC LIMIT 1;'
  );
  const testProduct = prodRes.rows[0];
  const unitPrice = parseFloat(testProduct.price_ex_vat);

  const orderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Delivery Test Customer',
      customerEmail: 'delivery.test@clinic.ng',
      customerPhone: '08099887766',
      clinicName: 'Abuja Medical Centre',
      paymentMethod: 'bank_transfer',
      shippingAddressLine1: 'Plot 45 Garki Area',
      shippingCity: 'Abuja',
      shippingPostcode: '900001',
      items: [{ productId: testProduct.id, quantity: 2 }],
    }),
  });

  const orderData = (await orderRes.json()) as any;
  const pendingOrderId = orderData.order.id;
  const subtotal = unitPrice * 2;

  // --- Test 1: Verify initial default delivery fee is 0.00 ---
  try {
    const passed =
      orderRes.status === 201 &&
      Number(orderData.order.deliveryFee) === 0 &&
      Math.abs(Number(orderData.order.total) - subtotal) < 0.01;

    results.push({
      name: '1. New order initializes with independent delivery fee (₦0.00)',
      passed,
      status: orderRes.status,
      expectedStatus: 201,
      details: `Delivery Fee: ₦${orderData.order.deliveryFee}, Total: ₦${orderData.order.total}`,
    });
  } catch (err: any) {
    results.push({
      name: '1. Initial delivery fee',
      passed: false,
      status: 0,
      expectedStatus: 201,
      details: err.message,
    });
  }

  // --- Test 2: Admin updates delivery fee on pending order ---
  try {
    const newDeliveryFee = 3500.00; // ₦3,500 delivery charge
    const res = await fetch(`${BASE_URL}/api/v1/admin/orders/${pendingOrderId}/delivery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        deliveryFee: newDeliveryFee,
      }),
    });

    const data = (await res.json()) as any;
    const expectedTotal = subtotal + newDeliveryFee;

    const passed =
      res.status === 200 &&
      Number(data.order.deliveryFee) === newDeliveryFee &&
      Math.abs(Number(data.order.total) - expectedTotal) < 0.01;

    results.push({
      name: '2. Admin updates delivery fee -> Server recalculates total (Subtotal + Delivery)',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: `Subtotal: ₦${subtotal}, Delivery: ₦${data.order?.deliveryFee}, Recalculated Total: ₦${data.order?.total}`,
    });
  } catch (err: any) {
    results.push({
      name: '2. Admin updates delivery fee',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 3: Reject negative delivery fee ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/orders/${pendingOrderId}/delivery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        deliveryFee: -500,
      }),
    });

    const data = (await res.json()) as any;
    const passed = res.status === 400;

    results.push({
      name: '3. Negative delivery fee rejected -> 400 Bad Request',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '3. Reject negative delivery fee',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Test 4: Reject unauthenticated delivery fee update ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/orders/${pendingOrderId}/delivery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deliveryFee: 2000,
      }),
    });

    const passed = res.status === 401;

    results.push({
      name: '4. Unauthenticated request to update delivery fee -> 401 Unauthorized',
      passed,
      status: res.status,
      expectedStatus: 401,
      details: `Status: ${res.status}`,
    });
  } catch (err: any) {
    results.push({
      name: '4. Unauthenticated request rejection',
      passed: false,
      status: 0,
      expectedStatus: 401,
      details: err.message,
    });
  }

  // --- Test 5: Paid order cannot have delivery fee silently modified ---
  try {
    // Mark order as paid
    await query("UPDATE orders SET payment_status = 'paid' WHERE id = $1;", [pendingOrderId]);

    const res = await fetch(`${BASE_URL}/api/v1/admin/orders/${pendingOrderId}/delivery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        deliveryFee: 5000,
      }),
    });

    const data = (await res.json()) as any;
    const passed = res.status === 400 && data.error?.includes('already been');

    results.push({
      name: '5. Cannot modify delivery fee on already-paid order -> 400 Bad Request',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '5. Protect paid order delivery fee',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Print Summary ---
  console.log('\n====================================================');
  console.log('📊 DELIVERY TEST RESULTS SUMMARY');
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

runDeliveryTests();
