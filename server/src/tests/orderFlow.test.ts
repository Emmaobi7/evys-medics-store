/**
 * EVYS Medical — Order Engine & Cart Validation Automated Test Suite
 *
 * Covers 15 critical test cases:
 * 1. Valid order -> success (201)
 * 2. Correct order total generated server-side (authoritative prices, VAT, free shipping threshold)
 * 3. Client attempts to manipulate price -> ignored/rejected (server calculates prices from DB)
 * 4. Quantity 0 -> rejected (400 validation error)
 * 5. Negative quantity -> rejected (400 validation error)
 * 6. Excessive quantity (>9999) -> rejected (400 validation error)
 * 7. Insufficient stock -> rejected (409 Conflict)
 * 8. Concurrent purchase of final unit -> only one succeeds, the other fails safely
 * 9. Failed transaction -> no partial stock deduction (atomic rollback in DB)
 * 10. Order snapshot preserves original price (immutable historical record)
 * 11. Duplicate submission behavior is safe (idempotent duplicate request)
 * 12. Empty cart -> rejected (400 validation error)
 * 13. Invalid product/SKU -> rejected (400 validation error)
 * 14. Successful order -> stock decreases correctly in PostgreSQL
 * 15. Successful order -> order items/snapshots created correctly in PostgreSQL
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

async function getProductAndStock(productId: string) {
  const res = await query<any>(
    `
    SELECT p.*, COALESCE(inv.stock_count, 0) AS stock_count, inv.track_inventory
    FROM products p
    LEFT JOIN inventory inv ON inv.product_id = p.id
    WHERE p.id = $1;
    `,
    [productId]
  );
  return res.rows[0];
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING EVYS MEDICAL ORDER & CART TEST SUITE');
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log('====================================================\n');

  // Find a test product in the database
  const prodRes = await query<any>(
    'SELECT id, sku, name, price_ex_vat FROM products WHERE is_active = TRUE ORDER BY id ASC LIMIT 3;'
  );

  if (prodRes.rows.length === 0) {
    console.error('❌ No active products found in database. Run migrations/seeds first.');
    process.exit(1);
  }

  const testProduct1 = prodRes.rows[0];
  const testProduct2 = prodRes.rows[1] || prodRes.rows[0];

  // Set known initial stock for testProduct1 and testProduct2
  await query('UPDATE inventory SET stock_count = 50 WHERE product_id = $1;', [testProduct1.id]);
  await query('UPDATE inventory SET stock_count = 50 WHERE product_id = $1;', [testProduct2.id]);

  // --- Test 1: Valid order -> success (201) ---
  let createdOrderId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Dr. John Watson',
        customerEmail: 'watson@bakerstclinic.co.uk',
        customerPhone: '07700900123',
        clinicName: 'Baker Street Clinic',
        paymentMethod: 'invoice',
        shippingAddressLine1: '221B Baker Street',
        shippingCity: 'London',
        shippingPostcode: 'NW1 6XE',
        items: [{ productId: testProduct1.id, quantity: 2 }],
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 201 && Boolean(data.order?.id) && Boolean(data.order?.orderNumber);
    if (passed) createdOrderId = data.order.id;

    results.push({
      name: '1. Valid order -> 201 Created & returns orderNumber',
      passed,
      status: res.status,
      expectedStatus: 201,
      details: passed ? `Order: ${data.order.orderNumber} (ID: ${data.order.id})` : JSON.stringify(data),
    });
  } catch (err: any) {
    results.push({
      name: '1. Valid order',
      passed: false,
      status: 0,
      expectedStatus: 201,
      details: err.message,
    });
  }

  // --- Test 2: Correct order total generated server-side ---
  try {
    const unitPrice = parseFloat(testProduct1.price_ex_vat);
    const qty = 2;
    const expectedSubtotal = unitPrice * qty;
    const expectedShipping = expectedSubtotal >= config.commerce.freeShippingThreshold ? 0 : config.commerce.standardShippingRate;
    const expectedVat = expectedSubtotal * 0.20;
    const expectedGrandTotal = expectedSubtotal + expectedShipping + expectedVat;

    const res = await fetch(`${BASE_URL}/api/v1/orders/${createdOrderId}`);
    const data = (await res.json()) as any;

    const diff = Math.abs((data.order?.financials?.grandTotalIncVat || 0) - expectedGrandTotal);
    const passed = res.status === 200 && diff < 0.05;

    results.push({
      name: '2. Correct order total generated server-side (Authoritative subtotal, VAT, shipping)',
      passed,
      status: res.status,
      expectedStatus: 200,
      details: `Expected: £${expectedGrandTotal.toFixed(2)} | Calculated: £${data.order?.financials?.grandTotalIncVat?.toFixed(2)}`,
    });
  } catch (err: any) {
    results.push({
      name: '2. Correct order total generated server-side',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 3: Client attempts to manipulate price -> server ignores client price ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Attacker Customer',
        customerEmail: 'hacker@test.com',
        customerPhone: '07700900999',
        shippingAddressLine1: '1 Fake Street',
        shippingCity: 'London',
        shippingPostcode: 'EC1A 1BB',
        price: 0.01,
        unitPrice: 0.01,
        grandTotalIncVat: 0.01,
        items: [
          {
            productId: testProduct1.id,
            quantity: 1,
            price: 0.01,
            unitPrice: 0.01,
          },
        ],
      }),
    });
    const data = (await res.json()) as any;
    const expectedSubtotal = parseFloat(testProduct1.price_ex_vat);
    const passed = res.status === 201 && Math.abs(data.order?.subtotalExVat - expectedSubtotal) < 0.05;

    results.push({
      name: '3. Client attempts to manipulate price -> Ignored/Authoritative server price used',
      passed,
      status: res.status,
      expectedStatus: 201,
      details: `Client sent £0.01 -> Server charged authoritative £${data.order?.subtotalExVat}`,
    });
  } catch (err: any) {
    results.push({
      name: '3. Client attempts to manipulate price',
      passed: false,
      status: 0,
      expectedStatus: 201,
      details: err.message,
    });
  }

  // --- Test 4: Quantity 0 -> rejected (400) ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Zero Quantity Test',
        customerEmail: 'zero@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: testProduct1.id, quantity: 0 }],
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 400;

    results.push({
      name: '4. Quantity 0 -> 400 Validation Error',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: data.error || JSON.stringify(data.details),
    });
  } catch (err: any) {
    results.push({
      name: '4. Quantity 0',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Test 5: Negative quantity -> rejected (400) ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Negative Quantity Test',
        customerEmail: 'negative@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: testProduct1.id, quantity: -5 }],
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 400;

    results.push({
      name: '5. Negative quantity -> 400 Validation Error',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: data.error || JSON.stringify(data.details),
    });
  } catch (err: any) {
    results.push({
      name: '5. Negative quantity',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Test 6: Excessive quantity (>9999) -> rejected (400) ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Excessive Quantity Test',
        customerEmail: 'excessive@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: testProduct1.id, quantity: 100000 }],
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 400;

    results.push({
      name: '6. Excessive quantity (100,000) -> 400 Validation Error',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: data.error || JSON.stringify(data.details),
    });
  } catch (err: any) {
    results.push({
      name: '6. Excessive quantity',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Test 7: Insufficient stock -> rejected (409 Conflict) ---
  try {
    // Set stock of testProduct2 to 3
    await query('UPDATE inventory SET stock_count = 3 WHERE product_id = $1;', [testProduct2.id]);

    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Stock Exceeded Test',
        customerEmail: 'overstock@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: testProduct2.id, quantity: 10 }],
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 409 && data.error?.includes('Insufficient stock');

    results.push({
      name: '7. Insufficient stock (Requested: 10, Available: 3) -> 409 Conflict',
      passed,
      status: res.status,
      expectedStatus: 409,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '7. Insufficient stock',
      passed: false,
      status: 0,
      expectedStatus: 409,
      details: err.message,
    });
  }

  // --- Test 8: Concurrent purchase of final unit -> only one succeeds ---
  try {
    // Set stock to exactly 1
    await query('UPDATE inventory SET stock_count = 1 WHERE product_id = $1;', [testProduct2.id]);

    const orderPayload1 = {
      customerName: 'Concurrent Customer A',
      customerEmail: 'buyer.a@clinic.com',
      customerPhone: '07700900111',
      shippingAddressLine1: '100 Road A',
      shippingCity: 'London',
      shippingPostcode: 'SW1A 1AA',
      items: [{ productId: testProduct2.id, quantity: 1 }],
    };

    const orderPayload2 = {
      customerName: 'Concurrent Customer B',
      customerEmail: 'buyer.b@clinic.com',
      customerPhone: '07700900222',
      shippingAddressLine1: '200 Road B',
      shippingCity: 'London',
      shippingPostcode: 'SW1A 1BB',
      items: [{ productId: testProduct2.id, quantity: 1 }],
    };

    // Fire both concurrently
    const [res1, res2] = await Promise.all([
      fetch(`${BASE_URL}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload1),
      }),
      fetch(`${BASE_URL}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload2),
      }),
    ]);

    const [data1, data2] = await Promise.all([res1.json() as Promise<any>, res2.json() as Promise<any>]);

    const successCount = (res1.status === 201 ? 1 : 0) + (res2.status === 201 ? 1 : 0);
    const failureCount = (res1.status === 409 ? 1 : 0) + (res2.status === 409 ? 1 : 0);

    // Verify stock is now exactly 0, not negative
    const finalStockRow = await getProductAndStock(testProduct2.id);
    const finalStock = finalStockRow.stock_count;

    const passed = successCount === 1 && failureCount === 1 && finalStock === 0;

    results.push({
      name: '8. Concurrent purchase of final unit -> Exactly one succeeds (201), other fails (409)',
      passed,
      status: 200,
      expectedStatus: 200,
      details: `Successes: ${successCount}, Conflicts: ${failureCount}, Final stock: ${finalStock}`,
    });
  } catch (err: any) {
    results.push({
      name: '8. Concurrent purchase of final unit',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 9: Failed transaction -> no partial stock deduction (rollback test) ---
  try {
    // Reset stock to 20 for testProduct1
    await query('UPDATE inventory SET stock_count = 20 WHERE product_id = $1;', [testProduct1.id]);

    // Send order with valid testProduct1 and a nonexistent product ID
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Rollback Test Customer',
        customerEmail: 'rollback@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [
          { productId: testProduct1.id, quantity: 5 },
          { productId: 'nonexistent-prod-999', quantity: 1 },
        ],
      }),
    });

    const stockAfter = (await getProductAndStock(testProduct1.id)).stock_count;
    const passed = res.status === 400 && stockAfter === 20;

    results.push({
      name: '9. Failed transaction -> Atomic rollback (No partial stock deducted)',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: `Initial stock: 20 -> Stock after rolled back request: ${stockAfter}`,
    });
  } catch (err: any) {
    results.push({
      name: '9. Failed transaction',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Test 10: Order snapshot preserves original price ---
  try {
    // Reset stock and purchase at current price
    await query('UPDATE inventory SET stock_count = 10 WHERE product_id = $1;', [testProduct1.id]);
    const currentPrice = parseFloat(testProduct1.price_ex_vat);

    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Snapshot Test Customer',
        customerEmail: 'snapshot@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: testProduct1.id, quantity: 1 }],
      }),
    });
    const data = (await res.json()) as any;
    const snapshotOrderId = data.order.id;

    // Simulate price change in products catalog
    await query('UPDATE products SET price_ex_vat = 9999.00 WHERE id = $1;', [testProduct1.id]);

    // Retrieve order and check item snapshot
    const orderRes = await fetch(`${BASE_URL}/api/v1/orders/${snapshotOrderId}`);
    const orderData = (await orderRes.json()) as any;
    const linePrice = orderData.order.items[0].unitPriceExVat;

    // Restore original price
    await query('UPDATE products SET price_ex_vat = $1 WHERE id = $2;', [currentPrice, testProduct1.id]);

    const passed = Math.abs(linePrice - currentPrice) < 0.01;

    results.push({
      name: '10. Order snapshot preserves original purchase price regardless of future catalog changes',
      passed,
      status: orderRes.status,
      expectedStatus: 200,
      details: `Purchased at: £${currentPrice.toFixed(2)} | Catalog changed to: £9999.00 | Snapshot preserved: £${linePrice.toFixed(2)}`,
    });
  } catch (err: any) {
    results.push({
      name: '10. Order snapshot preserves original price',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 11: Duplicate submission behavior is safe (Idempotency) ---
  try {
    await query('UPDATE inventory SET stock_count = 20 WHERE product_id = $1;', [testProduct1.id]);
    const idempotencyKey = `test_idem_${Date.now()}_${Math.random()}`;

    const orderPayload = {
      customerName: 'Idempotency Customer',
      customerEmail: 'idem@test.com',
      customerPhone: '07700900123',
      shippingAddressLine1: '10 High Street',
      shippingCity: 'London',
      shippingPostcode: 'SW1A 1AA',
      idempotencyKey,
      items: [{ productId: testProduct1.id, quantity: 2 }],
    };

    // First submission
    const res1 = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data1 = (await res1.json()) as any;

    // Second repeated submission with identical idempotency key
    const res2 = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data2 = (await res2.json()) as any;

    const stockNow = (await getProductAndStock(testProduct1.id)).stock_count;

    // Stock should only have been deducted ONCE (20 - 2 = 18, NOT 16)
    const passed =
      res1.status === 201 &&
      res2.status === 200 &&
      data2.isDuplicate === true &&
      data1.order.id === data2.order.id &&
      stockNow === 18;

    results.push({
      name: '11. Duplicate submission with Idempotency-Key returns original order without re-deducting stock',
      passed,
      status: res2.status,
      expectedStatus: 200,
      details: `First: 201 (${data1.order?.orderNumber}), Second: 200 (Duplicate: ${data2.isDuplicate}), Stock: 18 (Deducted once)`,
    });
  } catch (err: any) {
    results.push({
      name: '11. Duplicate submission idempotency',
      passed: false,
      status: 0,
      expectedStatus: 200,
      details: err.message,
    });
  }

  // --- Test 12: Empty cart -> rejected (400) ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Empty Cart Customer',
        customerEmail: 'empty@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [],
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 400;

    results.push({
      name: '12. Empty cart items array -> 400 Validation Error',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: data.error || JSON.stringify(data.details),
    });
  } catch (err: any) {
    results.push({
      name: '12. Empty cart',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Test 13: Invalid product/SKU -> rejected (400) ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Invalid SKU Customer',
        customerEmail: 'invalid@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: 'completely-bogus-sku-99999', quantity: 1 }],
      }),
    });
    const data = (await res.json()) as any;
    const passed = res.status === 400 && data.error?.includes('not available');

    results.push({
      name: '13. Invalid product ID -> 400 Validation Error',
      passed,
      status: res.status,
      expectedStatus: 400,
      details: data.error,
    });
  } catch (err: any) {
    results.push({
      name: '13. Invalid product ID',
      passed: false,
      status: 0,
      expectedStatus: 400,
      details: err.message,
    });
  }

  // --- Test 14: Successful order -> Stock decreases correctly in PostgreSQL ---
  try {
    await query('UPDATE inventory SET stock_count = 15 WHERE product_id = $1;', [testProduct1.id]);

    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Stock Deduction Customer',
        customerEmail: 'deduct@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: testProduct1.id, quantity: 4 }],
      }),
    });

    const stockAfter = (await getProductAndStock(testProduct1.id)).stock_count;
    const passed = res.status === 201 && stockAfter === 11;

    results.push({
      name: '14. Successful order -> Stock accurately deducted in PostgreSQL (15 - 4 = 11)',
      passed,
      status: res.status,
      expectedStatus: 201,
      details: `Before: 15, Purchased: 4, DB stock after: ${stockAfter}`,
    });
  } catch (err: any) {
    results.push({
      name: '14. Stock deduction in PostgreSQL',
      passed: false,
      status: 0,
      expectedStatus: 201,
      details: err.message,
    });
  }

  // --- Test 15: Successful order -> Order items and snapshots created in PostgreSQL ---
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Item Snapshot Customer',
        customerEmail: 'snapshot.items@test.com',
        customerPhone: '07700900123',
        shippingAddressLine1: '10 High Street',
        shippingCity: 'London',
        shippingPostcode: 'SW1A 1AA',
        items: [{ productId: testProduct1.id, quantity: 3 }],
      }),
    });
    const data = (await res.json()) as any;
    const ordId = data.order.id;

    // Direct DB query on order_items table
    const itemsDb = await query<any>(
      'SELECT * FROM order_items WHERE order_id = $1;',
      [ordId]
    );

    const firstItem = itemsDb.rows[0];
    const passed =
      res.status === 201 &&
      itemsDb.rows.length === 1 &&
      firstItem.product_id === testProduct1.id &&
      firstItem.sku_snapshot === testProduct1.sku &&
      firstItem.quantity === 3 &&
      parseFloat(firstItem.unit_price_ex_vat) === parseFloat(testProduct1.price_ex_vat);

    results.push({
      name: '15. Successful order -> Immutable order_items records verified in PostgreSQL',
      passed,
      status: res.status,
      expectedStatus: 201,
      details: `DB row: SKU: ${firstItem?.sku_snapshot}, Qty: ${firstItem?.quantity}, Unit Price: £${firstItem?.unit_price_ex_vat}`,
    });
  } catch (err: any) {
    results.push({
      name: '15. Order items in PostgreSQL',
      passed: false,
      status: 0,
      expectedStatus: 201,
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

  await pool.end();

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
