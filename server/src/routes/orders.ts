import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getClient, query } from '../db/connection';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/env';
import { addMoney, multiplyMoney } from '../utils/money';

export const ordersRouter = Router();

const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().trim().min(2, 'Customer name is required').max(128, 'Customer name too long'),
    customerEmail: z.string().trim().email('Valid email is required').max(128, 'Email too long'),
    customerPhone: z.string().trim().min(6, 'Valid telephone is required').max(32, 'Phone too long'),
    clinicName: z.string().trim().max(128).optional(),
    poNumber: z.string().trim().max(64).optional(),
    paymentMethod: z.enum(['paystack', 'card', 'bank_transfer', 'invoice', 'nhs_po']).default('paystack'),
    shippingAddressLine1: z.string().trim().min(3, 'Address is required').max(255),
    shippingCity: z.string().trim().min(2, 'City is required').max(128),
    shippingPostcode: z.string().trim().min(2, 'Postal code is required').max(32),
    shippingCountry: z.string().trim().max(64).default('Nigeria'),
    idempotencyKey: z.string().trim().max(128).optional(),
    items: z.array(
      z.object({
        productId: z.string().trim().min(1, 'Product ID is required'),
        quantity: z
          .number()
          .int('Quantity must be an integer')
          .positive('Quantity must be greater than 0')
          .max(9999, 'Quantity must not exceed 9999'),
      })
    ).min(1, 'Order must contain at least one item'),
  }),
});

/**
 * Generate a human-readable unique order number: EVS-ORD-2026-XXXXXX
 */
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `EVS-ORD-${year}-${randomSuffix}`;
}

/**
 * Helper to format order database row to standard API response
 */
export function formatOrderRow(orderRow: any, itemCount?: number) {
  const subtotal = parseFloat(orderRow.subtotal_ex_vat || '0');
  const deliveryFee = parseFloat(orderRow.delivery_fee ?? orderRow.shipping_ex_vat ?? '0');
  const total = parseFloat(orderRow.grand_total_inc_vat || '0');

  return {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    status: orderRow.status,
    paymentStatus: orderRow.payment_status,
    paymentMethod: orderRow.payment_method,
    subtotal,
    subtotalExVat: subtotal,
    deliveryFee,
    shippingExVat: deliveryFee,
    vatTotal: 0.00,
    total,
    totalAmount: total,
    grandTotalIncVat: total,
    currency: orderRow.currency || 'NGN',
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    itemCount: itemCount !== undefined ? itemCount : undefined,
  };
}

/**
 * POST /api/v1/orders
 * Transaction-safe order creation with authoritative inventory, tax-inclusive pricing, and snapshots
 */
ordersRouter.post(
  '/',
  validate(createOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const rawIdempotencyKey =
      (req.headers['idempotency-key'] as string | undefined) ||
      req.body.idempotencyKey;
    const idempotencyKey = rawIdempotencyKey ? rawIdempotencyKey.trim() : undefined;

    // Idempotency check: if key already exists, return previous order without deducting stock again
    if (idempotencyKey) {
      const existing = await query<any>(
        'SELECT * FROM orders WHERE idempotency_key = $1 LIMIT 1;',
        [idempotencyKey]
      );
      if (existing.rows.length > 0) {
        const existingOrder = existing.rows[0];
        const countRes = await query<{ count: string }>(
          'SELECT COALESCE(SUM(quantity), 0) AS count FROM order_items WHERE order_id = $1;',
          [existingOrder.id]
        );
        const itemCount = parseInt(countRes.rows[0]?.count || '0', 10);
        return res.status(200).json({
          message: 'Order already processed (idempotent duplicate request)',
          isDuplicate: true,
          order: formatOrderRow(existingOrder, itemCount),
        });
      }
    }

    const client = await getClient();

    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        clinicName,
        poNumber,
        paymentMethod,
        shippingAddressLine1,
        shippingCity,
        shippingPostcode,
        shippingCountry,
        items,
      } = req.body;

      await client.query('BEGIN');

      const productIds = items.map((i: any) => i.productId);

      // Lock inventory rows to prevent race conditions during checkout
      const inventoryQuery = `
        SELECT product_id, stock_count, track_inventory
        FROM inventory
        WHERE product_id = ANY($1)
        FOR UPDATE;
      `;
      const invRes = await client.query(inventoryQuery, [productIds]);
      const invMap = new Map<string, any>();
      invRes.rows.forEach((inv) => invMap.set(inv.product_id, inv));

      // Fetch active product definitions
      const productQuery = `
        SELECT id, sku, name, price_ex_vat, is_active
        FROM products
        WHERE id = ANY($1);
      `;
      const prodRes = await client.query(productQuery, [productIds]);
      const productMap = new Map<string, any>();
      prodRes.rows.forEach((p) => {
        const inv = invMap.get(p.id);
        productMap.set(p.id, {
          ...p,
          stock_count: inv ? inv.stock_count : 0,
          track_inventory: inv ? inv.track_inventory : false,
        });
      });

      // Validate all items exist, are active, and have sufficient stock
      const orderLines: any[] = [];
      let subtotal = 0;

      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod || !prod.is_active) {
          throw new AppError(`Product with ID "${item.productId}" is not available or has been discontinued.`, 400);
        }

        const currentStock = parseInt(prod.stock_count || '0', 10);
        if (prod.track_inventory && currentStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${prod.name}" (SKU: ${prod.sku}). Available: ${currentStock}, Requested: ${item.quantity}`,
            409
          );
        }

        // Tax-inclusive authoritative product price
        const unitPrice = parseFloat(prod.price_ex_vat);
        const lineTotal = multiplyMoney(unitPrice, item.quantity);
        subtotal = addMoney(subtotal, lineTotal);

        orderLines.push({
          productId: prod.id,
          skuSnapshot: prod.sku,
          productNameSnapshot: prod.name,
          unitPrice,
          quantity: item.quantity,
          vatRate: 0.00,
          lineTotal,
          trackInventory: prod.track_inventory,
        });
      }

      // Initial admin-controlled delivery fee (default: 0.00 or configured default)
      const deliveryFee = config.commerce.defaultDeliveryFee || 0.00;
      const totalAmount = addMoney(subtotal, deliveryFee);

      const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const orderNumber = generateOrderNumber();

      // Initial payment status
      const paymentStatus = paymentMethod === 'invoice'
        ? 'pending'
        : paymentMethod === 'nhs_po'
        ? 'pending'
        : 'pending';

      const currency = config.commerce.currency || 'NGN';

      // Insert Order with idempotency key
      const insertOrderSql = `
        INSERT INTO orders (
          id, order_number, status, payment_status, payment_method,
          customer_name, customer_email, customer_phone, clinic_name, po_number,
          shipping_address_line1, shipping_city, shipping_postcode, shipping_country,
          subtotal_ex_vat, shipping_ex_vat, delivery_fee, vat_total, grand_total_inc_vat, currency,
          idempotency_key
        )
        VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15, 0.00, $16, $17, $18)
        RETURNING *;
      `;

      const orderResult = await client.query(insertOrderSql, [
        orderId,
        orderNumber,
        paymentStatus,
        paymentMethod,
        customerName,
        customerEmail,
        customerPhone,
        clinicName || null,
        poNumber || null,
        shippingAddressLine1,
        shippingCity,
        shippingPostcode,
        shippingCountry || 'Nigeria',
        subtotal.toFixed(2),
        deliveryFee.toFixed(2),
        totalAmount.toFixed(2),
        currency,
        idempotencyKey || null,
      ]);

      // Insert Order Items and decrement inventory with concurrency check
      for (const line of orderLines) {
        await client.query(
          `
          INSERT INTO order_items (
            order_id, product_id, sku_snapshot, product_name_snapshot,
            unit_price_ex_vat, quantity, vat_rate, line_total_ex_vat
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
          `,
          [
            orderId,
            line.productId,
            line.skuSnapshot,
            line.productNameSnapshot,
            line.unitPrice.toFixed(2),
            line.quantity,
            0.00,
            line.lineTotal.toFixed(2),
          ]
        );

        // Atomic deduction with stock bounds check
        if (line.trackInventory) {
          const updateRes = await client.query(
            `
            UPDATE inventory
            SET stock_count = stock_count - $1, updated_at = NOW()
            WHERE product_id = $2 AND stock_count >= $1
            RETURNING stock_count;
            `,
            [line.quantity, line.productId]
          );

          if (updateRes.rowCount === 0) {
            throw new AppError(
              `Stock depleted for "${line.productNameSnapshot}" (SKU: ${line.skuSnapshot}) during order finalization.`,
              409
            );
          }
        }
      }

      await client.query('COMMIT');

      const totalItemsCount = orderLines.reduce((sum, l) => sum + l.quantity, 0);

      res.status(201).json({
        message: 'Order created successfully',
        order: formatOrderRow(orderResult.rows[0], totalItemsCount),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/v1/orders/:id
 * Retrieve order details by ID or orderNumber
 */
ordersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const orderSql = `
      SELECT * FROM orders
      WHERE id = $1 OR order_number = $1;
    `;
    const orderRes = await query(orderSql, [id]);
    if (orderRes.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const order = orderRes.rows[0];

    const itemsSql = `
      SELECT * FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC;
    `;
    const itemsRes = await query(itemsSql, [order.id]);

    const subtotal = parseFloat(order.subtotal_ex_vat);
    const deliveryFee = parseFloat(order.delivery_fee ?? order.shipping_ex_vat ?? '0');
    const totalAmount = parseFloat(order.grand_total_inc_vat);

    res.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        currency: order.currency || 'NGN',
        subtotal,
        deliveryFee,
        totalAmount,
        total: totalAmount,
        customer: {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          clinicName: order.clinic_name,
          poNumber: order.po_number,
        },
        shippingAddress: {
          addressLine1: order.shipping_address_line1,
          city: order.shipping_city,
          postcode: order.shipping_postcode,
          country: order.shipping_country,
        },
        financials: {
          subtotal,
          deliveryFee,
          total: totalAmount,
          currency: order.currency || 'NGN',
          // Backward compatibility fields
          subtotalExVat: subtotal,
          shippingExVat: deliveryFee,
          vatTotal: 0.00,
          grandTotalIncVat: totalAmount,
        },
        items: itemsRes.rows.map((item) => ({
          id: item.id,
          productId: item.product_id,
          sku: item.sku_snapshot,
          name: item.product_name_snapshot,
          unitPrice: parseFloat(item.unit_price_ex_vat),
          unitPriceExVat: parseFloat(item.unit_price_ex_vat),
          quantity: item.quantity,
          vatRate: 0.00,
          lineTotal: parseFloat(item.line_total_ex_vat),
          lineTotalExVat: parseFloat(item.line_total_ex_vat),
        })),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});
