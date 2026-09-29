import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getClient, query } from '../db/connection';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { cancelOrderAndRestoreStock } from '../services/orderService';

export const adminRouter = Router();

// Enforce authentication & administrator authorization on ALL admin endpoints
adminRouter.use(requireAuth, requireAdmin);

// ==================== ADMIN PRODUCTS ====================

/**
 * GET /api/v1/admin/products
 * List all products (including inactive) with inventory
 */
adminRouter.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT 
        p.*,
        c.name AS category_name,
        COALESCE(inv.stock_count, 0) AS stock_count,
        (
          SELECT img.image_url 
          FROM product_images img 
          WHERE img.product_id = p.id 
          ORDER BY img.sort_order ASC 
          LIMIT 1
        ) AS image_url
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN inventory inv ON inv.product_id = p.id
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await query(sql);

    res.json({
      products: rows.map((r) => ({
        id: r.id,
        sku: r.sku,
        name: r.name,
        slug: r.slug,
        category: r.category_id,
        categoryName: r.category_name,
        brand: r.brand,
        priceExVat: parseFloat(r.price_ex_vat),
        compareAtPriceExVat: r.compare_at_price_ex_vat ? parseFloat(r.compare_at_price_ex_vat) : null,
        stockCount: parseInt(r.stock_count, 10),
        isActive: r.is_active,
        isFeatured: r.is_featured,
        imageUrl: r.image_url,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/products
 * Create a new product with images, specifications, and initial stock
 */
const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(2),
    name: z.string().min(2),
    slug: z.string().min(2),
    categoryId: z.string().min(1),
    subcategoryId: z.string().optional().nullable(),
    brand: z.string().min(1),
    shortDescription: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    productType: z.string().optional().nullable(),
    priceExVat: z.number().positive(),
    compareAtPriceExVat: z.union([z.number().positive(), z.literal(0)]).optional().nullable(),
    vatRate: z.number().default(0.20),
    leadTime: z.string().optional().nullable(),
    stockCount: z.number().int().min(0).default(0),
    images: z.array(z.string()).optional().nullable(),
    specifications: z.array(z.object({ name: z.string(), value: z.string() })).optional().nullable(),
    features: z.array(z.string()).optional().nullable(),
    isFeatured: z.boolean().default(false),
  }),
});

adminRouter.post(
  '/products',
  validate(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await getClient();
    try {
      const data = req.body;
      const productId = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      await client.query('BEGIN');

      // Insert product
      const insertSql = `
        INSERT INTO products (
          id, sku, name, slug, category_id, subcategory_id, brand,
          short_description, description, product_type, price_ex_vat,
          compare_at_price_ex_vat, vat_rate, lead_time, is_active, is_featured
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE, $15)
        RETURNING *;
      `;
      const prodRes = await client.query(insertSql, [
        productId,
        data.sku.trim(),
        data.name.trim(),
        data.slug.trim(),
        data.categoryId,
        data.subcategoryId || null,
        data.brand,
        data.shortDescription || '',
        data.description || '',
        data.productType || null,
        data.priceExVat,
        data.compareAtPriceExVat || null,
        data.vatRate || 0.20,
        data.leadTime || 'Standard Courier Dispatch',
        data.isFeatured || false,
      ]);

      // Insert inventory
      await client.query(
        `INSERT INTO inventory (product_id, stock_count, track_inventory) VALUES ($1, $2, TRUE);`,
        [productId, data.stockCount || 0]
      );

      // Insert images
      if (data.images && data.images.length > 0) {
        for (let idx = 0; idx < data.images.length; idx++) {
          await client.query(
            `INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3);`,
            [productId, data.images[idx], idx]
          );
        }
      }

      // Insert specifications
      if (data.specifications && data.specifications.length > 0) {
        for (let idx = 0; idx < data.specifications.length; idx++) {
          await client.query(
            `INSERT INTO product_specifications (product_id, name, value, sort_order) VALUES ($1, $2, $3, $4);`,
            [productId, data.specifications[idx].name, data.specifications[idx].value, idx]
          );
        }
      }

      // Insert features
      if (data.features && data.features.length > 0) {
        for (let idx = 0; idx < data.features.length; idx++) {
          await client.query(
            `INSERT INTO product_features (product_id, feature, sort_order) VALUES ($1, $2, $3);`,
            [productId, data.features[idx], idx]
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Product created successfully',
        product: prodRes.rows[0],
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
 * PATCH /api/v1/admin/products/:id/stock
 * Update stock count
 */
const updateStockSchema = z.object({
  body: z.object({
    stockCount: z.number().int().min(0),
  }),
});

adminRouter.patch(
  '/products/:id/stock',
  validate(updateStockSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { stockCount } = req.body;

      const sql = `
        UPDATE inventory
        SET stock_count = $1, updated_at = NOW()
        WHERE product_id = $2
        RETURNING *;
      `;
      const result = await query(sql, [stockCount, id]);
      if (result.rows.length === 0) {
        throw new AppError('Product not found in inventory', 404);
      }

      res.json({
        message: 'Stock updated successfully',
        productId: id,
        stockCount: result.rows[0].stock_count,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/admin/products/:id/price
 * Update base price_ex_vat and optional compare_at_price
 */
const updatePriceSchema = z.object({
  body: z.object({
    priceExVat: z.number().positive(),
    compareAtPriceExVat: z.number().positive().optional().nullable(),
  }),
});

adminRouter.patch(
  '/products/:id/price',
  validate(updatePriceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { priceExVat, compareAtPriceExVat } = req.body;

      const sql = `
        UPDATE products
        SET price_ex_vat = $1, compare_at_price_ex_vat = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, sku, name, price_ex_vat, compare_at_price_ex_vat;
      `;
      const result = await query(sql, [priceExVat, compareAtPriceExVat || null, id]);
      if (result.rows.length === 0) {
        throw new AppError('Product not found', 404);
      }

      res.json({
        message: 'Price updated successfully',
        product: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/admin/products/:id
 * Archive / Deactivate or permanently delete a product
 */
adminRouter.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      const sql = `DELETE FROM products WHERE id = $1 RETURNING id, sku;`;
      const result = await query(sql, [id]);
      if (result.rows.length === 0) {
        throw new AppError('Product not found', 404);
      }
      return res.json({
        message: 'Product permanently removed',
        product: result.rows[0],
      });
    }

    const sql = `
      UPDATE products
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      RETURNING id, sku, is_active;
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      message: 'Product deactivated/archived successfully',
      product: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/products/purge-all
 * Purge all products from the catalog (for uploading new custom catalog)
 */
adminRouter.post('/products/purge-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('DELETE FROM products RETURNING id;');
    res.json({
      message: `Successfully purged ${result.rowCount} products from the catalogue.`,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
});


// ==================== ADMIN ORDERS ====================

/**
 * GET /api/v1/admin/orders
 * List orders with status filters
 */
adminRouter.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const whereSql = status ? 'WHERE status = $1' : '';
    const params = status ? [status] : [];

    const sql = `
      SELECT 
        o.*,
        COUNT(oi.id)::int AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereSql}
      GROUP BY o.id
      ORDER BY o.created_at DESC;
    `;
    const { rows } = await query(sql, params);

    res.json({
      orders: rows.map((r) => {
        const subtotal = parseFloat(r.subtotal_ex_vat || '0');
        const deliveryFee = parseFloat(r.delivery_fee ?? r.shipping_ex_vat ?? '0');
        const totalAmount = parseFloat(r.grand_total_inc_vat || '0');

        return {
          id: r.id,
          orderNumber: r.order_number,
          status: r.status,
          paymentStatus: r.payment_status,
          paymentMethod: r.payment_method,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          clinicName: r.clinic_name,
          poNumber: r.po_number,
          subtotal,
          deliveryFee,
          totalAmount,
          grandTotalIncVat: totalAmount,
          currency: r.currency || 'NGN',
          itemCount: r.item_count,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/admin/orders/:id/delivery
 * Admin-controlled delivery fee update
 * Validates delivery fee, recalculates server-side total, and protects already paid orders
 */
const updateOrderDeliverySchema = z.object({
  body: z.object({
    deliveryFee: z.number().min(0, 'Delivery fee must be greater than or equal to 0'),
  }),
});

adminRouter.patch(
  '/orders/:id/delivery',
  validate(updateOrderDeliverySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { deliveryFee } = req.body;

      // 1. Fetch current order
      const orderRes = await query<any>(
        'SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1;',
        [id]
      );

      if (orderRes.rows.length === 0) {
        throw new AppError('Order not found', 404);
      }

      const order = orderRes.rows[0];

      // 2. Security rule: Prevent modifying delivery fee on already paid orders
      if (order.payment_status === 'paid') {
        throw new AppError(
          'Cannot modify delivery fee on an order that has already been successfully paid.',
          400
        );
      }

      // 3. Recalculate server-authoritative total
      const subtotal = parseFloat(order.subtotal_ex_vat);
      const newTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

      // 4. Update database
      const updateSql = `
        UPDATE orders
        SET 
          delivery_fee = $1,
          shipping_ex_vat = $1,
          grand_total_inc_vat = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;

      const result = await query(updateSql, [
        deliveryFee.toFixed(2),
        newTotal.toFixed(2),
        order.id,
      ]);

      // Invalidate any uncompleted pending payment attempts so old amounts cannot be verified
      await query(
        `
        UPDATE payments
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE order_id = $1 AND status = 'pending';
        `,
        [order.id]
      );

      const updated = result.rows[0];

      res.json({
        message: 'Order delivery fee updated successfully',
        order: {
          id: updated.id,
          orderNumber: updated.order_number,
          status: updated.status,
          paymentStatus: updated.payment_status,
          subtotal: parseFloat(updated.subtotal_ex_vat),
          deliveryFee: parseFloat(updated.delivery_fee),
          total: parseFloat(updated.grand_total_inc_vat),
          totalAmount: parseFloat(updated.grand_total_inc_vat),
          currency: updated.currency || 'NGN',
          updatedAt: updated.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/admin/orders/:id/status
 * Update order status or payment status with automatic stock restoration on cancellation
 */
const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'ready', 'dispatched', 'delivered', 'cancelled']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'cancelled']).optional(),
  }),
});

adminRouter.patch(
  '/orders/:id/status',
  validate(updateOrderStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;

      // If cancelling order, perform safe transaction cancellation with stock restoration
      if (status === 'cancelled') {
        const orderId = Array.isArray(id) ? id[0] : id;
        const cancelResult = await cancelOrderAndRestoreStock(orderId, 'Admin cancelled order');
        return res.json({
          message: 'Order status updated to cancelled and stock restored successfully',
          order: cancelResult,
        });
      }

      const updates: string[] = ['updated_at = NOW()'];
      const params: any[] = [];
      let idx = 1;

      if (status) {
        updates.push(`status = $${idx++}`);
        params.push(status);
      }
      if (paymentStatus) {
        updates.push(`payment_status = $${idx++}`);
        params.push(paymentStatus);
      }

      params.push(id);
      const sql = `
        UPDATE orders
        SET ${updates.join(', ')}
        WHERE id = $${idx} OR order_number = $${idx}
        RETURNING *;
      `;

      const result = await query(sql, params);
      if (result.rows.length === 0) {
        throw new AppError('Order not found', 404);
      }

      res.json({
        message: 'Order status updated successfully',
        order: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);
