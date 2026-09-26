import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { validate } from '../middleware/validate';
import { config } from '../config/env';

export const cartRouter = Router();

const validateCartSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().trim().optional(),
        sku: z.string().trim().optional(),
        quantity: z
          .number()
          .int('Quantity must be an integer')
          .positive('Quantity must be greater than 0')
          .max(9999, 'Quantity must not exceed 9999'),
      })
    ),
  }),
});

/**
 * POST /api/v1/cart/validate
 * Server-authoritative price, stock, VAT, and shipping calculation
 */
cartRouter.post(
  '/validate',
  validate(validateCartSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items } = req.body;

      if (!items || items.length === 0) {
        return res.json({
          items: [],
          subtotalExVat: 0,
          shippingExVat: 0,
          vatTotal: 0,
          grandTotalIncVat: 0,
          currency: 'GBP',
          freeShippingThreshold: config.commerce.freeShippingThreshold,
          shippingRemaining: config.commerce.freeShippingThreshold,
        });
      }

      const productIdentifiers = items.map((i: any) => i.productId || i.sku).filter(Boolean);

      const sql = `
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.price_ex_vat,
          p.vat_rate,
          p.is_active,
          COALESCE(inv.stock_count, 0) AS stock_count,
          (
            SELECT img.image_url 
            FROM product_images img 
            WHERE img.product_id = p.id 
            ORDER BY img.sort_order ASC 
            LIMIT 1
          ) AS image_url
        FROM products p
        LEFT JOIN inventory inv ON inv.product_id = p.id
        WHERE (p.id = ANY($1) OR p.sku = ANY($1)) AND p.is_active = TRUE;
      `;

      const { rows } = await query(sql, [productIdentifiers]);
      const productMap = new Map<string, any>();
      rows.forEach((r) => {
        productMap.set(r.id, r);
        productMap.set(r.sku, r);
      });

      const validatedItems: any[] = [];
      let subtotalExVat = 0;
      let totalVat = 0;

      for (const item of items) {
        const key = item.productId || item.sku;
        const prod = key ? productMap.get(key) : null;

        if (prod) {
          const unitPrice = parseFloat(prod.price_ex_vat);
          const vatRate = parseFloat(prod.vat_rate || '0.20');
          const stock = parseInt(prod.stock_count || '0', 10);
          
          // Bound quantity by available stock
          const validatedQty = Math.min(item.quantity, stock > 0 ? item.quantity : 0);
          const lineTotalExVat = unitPrice * validatedQty;
          const lineVat = lineTotalExVat * vatRate;

          subtotalExVat += lineTotalExVat;
          totalVat += lineVat;

          validatedItems.push({
            productId: prod.id,
            sku: prod.sku,
            name: prod.name,
            imageUrl: prod.image_url,
            unitPriceExVat: unitPrice,
            requestedQuantity: item.quantity,
            validatedQuantity: validatedQty,
            availableStock: stock,
            isAvailable: stock > 0,
            hasSufficientStock: stock >= item.quantity,
            vatRate,
            lineTotalExVat: parseFloat(lineTotalExVat.toFixed(2)),
            lineVatTotal: parseFloat(lineVat.toFixed(2)),
            lineTotalIncVat: parseFloat((lineTotalExVat + lineVat).toFixed(2)),
          });
        } else {
          validatedItems.push({
            productId: item.productId || '',
            sku: item.sku || '',
            name: 'Unavailable Product',
            unitPriceExVat: 0,
            requestedQuantity: item.quantity,
            validatedQuantity: 0,
            availableStock: 0,
            isAvailable: false,
            hasSufficientStock: false,
            vatRate: 0.20,
            lineTotalExVat: 0,
            lineVatTotal: 0,
            lineTotalIncVat: 0,
          });
        }
      }

      // Shipping calculation based on environment/config rules
      const freeThreshold = config.commerce.freeShippingThreshold;
      const shippingExVat = subtotalExVat >= freeThreshold || subtotalExVat === 0
        ? 0.00
        : config.commerce.standardShippingRate;

      const grandTotalIncVat = subtotalExVat + shippingExVat + totalVat;
      const shippingRemaining = Math.max(0, freeThreshold - subtotalExVat);

      res.json({
        items: validatedItems,
        subtotalExVat: parseFloat(subtotalExVat.toFixed(2)),
        shippingExVat: parseFloat(shippingExVat.toFixed(2)),
        vatTotal: parseFloat(totalVat.toFixed(2)),
        grandTotalIncVat: parseFloat(grandTotalIncVat.toFixed(2)),
        currency: 'GBP',
        freeShippingThreshold: freeThreshold,
        shippingRemaining: parseFloat(shippingRemaining.toFixed(2)),
      });
    } catch (error) {
      next(error);
    }
  }
);
