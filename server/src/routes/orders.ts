import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getClient, query } from '../db/connection';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/env';

export const ordersRouter = Router();

const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Customer name is required'),
    customerEmail: z.string().email('Valid email is required'),
    customerPhone: z.string().min(6, 'Valid telephone is required'),
    clinicName: z.string().optional(),
    poNumber: z.string().optional(),
    paymentMethod: z.enum(['invoice', 'nhs_po', 'card', 'bacs']).default('invoice'),
    shippingAddressLine1: z.string().min(3, 'Address is required'),
    shippingCity: z.string().min(2, 'City is required'),
    shippingPostcode: z.string().min(3, 'Postcode is required'),
    shippingCountry: z.string().default('United Kingdom'),
    items: z.array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive('Quantity must be greater than 0'),
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
 * POST /api/v1/orders
 * Transaction-safe order creation with authoritative inventory, pricing, and snapshots
 */
ordersRouter.post(
  '/',
  validate(createOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
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
        SELECT id, sku, name, price_ex_vat, vat_rate, is_active
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
      let subtotalExVat = 0;
      let totalVat = 0;

      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod || !prod.is_active) {
          throw new AppError(`Product with ID "${item.productId}" is not available.`, 400);
        }

        const currentStock = parseInt(prod.stock_count || '0', 10);
        if (prod.track_inventory && currentStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${prod.name}" (SKU: ${prod.sku}). Available: ${currentStock}, Requested: ${item.quantity}`,
            400
          );
        }

        const unitPriceExVat = parseFloat(prod.price_ex_vat);
        const vatRate = parseFloat(prod.vat_rate || '0.20');
        const lineTotalExVat = unitPriceExVat * item.quantity;
        const lineVat = lineTotalExVat * vatRate;

        subtotalExVat += lineTotalExVat;
        totalVat += lineVat;

        orderLines.push({
          productId: prod.id,
          skuSnapshot: prod.sku,
          productNameSnapshot: prod.name,
          unitPriceExVat,
          quantity: item.quantity,
          vatRate,
          lineTotalExVat,
          trackInventory: prod.track_inventory,
        });
      }

      // Calculate authoritative shipping
      const freeThreshold = config.commerce.freeShippingThreshold;
      const shippingExVat = subtotalExVat >= freeThreshold ? 0.00 : config.commerce.standardShippingRate;
      const grandTotalIncVat = subtotalExVat + shippingExVat + totalVat;

      const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const orderNumber = generateOrderNumber();

      // Initial payment status based on chosen method
      const paymentStatus = paymentMethod === 'nhs_po'
        ? 'po_verified'
        : paymentMethod === 'invoice'
        ? 'invoice_pending'
        : 'pending';

      // Insert Order
      const insertOrderSql = `
        INSERT INTO orders (
          id, order_number, status, payment_status, payment_method,
          customer_name, customer_email, customer_phone, clinic_name, po_number,
          shipping_address_line1, shipping_city, shipping_postcode, shipping_country,
          subtotal_ex_vat, shipping_ex_vat, vat_total, grand_total_inc_vat, currency
        )
        VALUES ($1, $2, 'confirmed', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'GBP')
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
        shippingCountry || 'United Kingdom',
        subtotalExVat.toFixed(2),
        shippingExVat.toFixed(2),
        totalVat.toFixed(2),
        grandTotalIncVat.toFixed(2),
      ]);

      // Insert Order Items and decrement inventory
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
            line.unitPriceExVat,
            line.quantity,
            line.vatRate,
            line.lineTotalExVat.toFixed(2),
          ]
        );

        // Deduct stock if inventory tracking is enabled
        if (line.trackInventory) {
          await client.query(
            `
            UPDATE inventory
            SET stock_count = GREATEST(0, stock_count - $1), updated_at = NOW()
            WHERE product_id = $2;
            `,
            [line.quantity, line.productId]
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          id: orderResult.rows[0].id,
          orderNumber: orderResult.rows[0].order_number,
          status: orderResult.rows[0].status,
          paymentStatus: orderResult.rows[0].payment_status,
          subtotalExVat: parseFloat(orderResult.rows[0].subtotal_ex_vat),
          shippingExVat: parseFloat(orderResult.rows[0].shipping_ex_vat),
          vatTotal: parseFloat(orderResult.rows[0].vat_total),
          grandTotalIncVat: parseFloat(orderResult.rows[0].grand_total_inc_vat),
          currency: orderResult.rows[0].currency,
          createdAt: orderResult.rows[0].created_at,
          itemCount: orderLines.reduce((sum, l) => sum + l.quantity, 0),
        },
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

    res.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
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
          subtotalExVat: parseFloat(order.subtotal_ex_vat),
          shippingExVat: parseFloat(order.shipping_ex_vat),
          vatTotal: parseFloat(order.vat_total),
          grandTotalIncVat: parseFloat(order.grand_total_inc_vat),
          currency: order.currency,
        },
        items: itemsRes.rows.map((item) => ({
          id: item.id,
          productId: item.product_id,
          sku: item.sku_snapshot,
          name: item.product_name_snapshot,
          unitPriceExVat: parseFloat(item.unit_price_ex_vat),
          quantity: item.quantity,
          vatRate: parseFloat(item.vat_rate),
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
