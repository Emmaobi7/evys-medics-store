import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

export const productsRouter = Router();

const listProductsQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    product_type: z.string().optional(),
    min_price: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    max_price: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    in_stock: z.enum(['true', 'false', '1', '0']).optional(),
    badge: z.string().optional(),
    sort: z.enum(['relevance', 'price-asc', 'price-desc', 'name-asc', 'newest']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

/**
 * Helper: Format a raw database product row into clean API format
 */
function formatProduct(row: any) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    category: row.category_id,
    categoryName: row.category_name,
    subcategory: row.subcategory_id || undefined,
    subcategoryName: row.subcategory_name || undefined,
    brand: row.brand,
    shortDescription: row.short_description || '',
    description: row.description ? row.description.split('\n\n') : [],
    productType: row.product_type || undefined,
    price: parseFloat(row.price_ex_vat),
    compareAtPrice: row.compare_at_price_ex_vat ? parseFloat(row.compare_at_price_ex_vat) : undefined,
    vatRate: parseFloat(row.vat_rate || '0.20'),
    leadTime: row.lead_time || 'Standard Courier Dispatch',
    inStock: row.in_stock ?? (parseInt(row.stock_count || '0', 10) > 0),
    stockCount: parseInt(row.stock_count || '0', 10),
    isFeatured: Boolean(row.is_featured),
    images: Array.isArray(row.images) && row.images[0] !== null ? row.images : [],
    features: Array.isArray(row.features) && row.features[0] !== null ? row.features : [],
    specifications: Array.isArray(row.specifications) && row.specifications[0] !== null ? row.specifications : [],
  };
}

/**
 * GET /api/v1/products
 * Filterable, searchable, paginated catalogue
 */
productsRouter.get(
  '/',
  validate(listProductsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q as string | undefined;
      const category = req.query.category as string | undefined;
      const subcategory = req.query.subcategory as string | undefined;
      const brand = req.query.brand as string | undefined;
      const productType = req.query.product_type as string | undefined;
      const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
      const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;
      const inStock = req.query.in_stock === 'true' || req.query.in_stock === '1';
      const sort = (req.query.sort as string) || 'relevance';
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '12', 10)));
      const offset = (page - 1) * limit;

      const whereClauses: string[] = ['p.is_active = TRUE'];
      const params: any[] = [];
      let paramIdx = 1;

      if (category && category !== 'all') {
        whereClauses.push(`p.category_id = $${paramIdx++}`);
        params.push(category);
      }

      if (subcategory && subcategory !== 'all') {
        whereClauses.push(`p.subcategory_id = $${paramIdx++}`);
        params.push(subcategory);
      }

      if (brand && brand !== 'all') {
        whereClauses.push(`p.brand = $${paramIdx++}`);
        params.push(brand);
      }

      if (productType && productType !== 'all') {
        whereClauses.push(`p.product_type = $${paramIdx++}`);
        params.push(productType);
      }

      if (minPrice !== undefined) {
        whereClauses.push(`p.price_ex_vat >= $${paramIdx++}`);
        params.push(minPrice);
      }

      if (maxPrice !== undefined) {
        whereClauses.push(`p.price_ex_vat <= $${paramIdx++}`);
        params.push(maxPrice);
      }

      if (inStock) {
        whereClauses.push(`COALESCE(inv.stock_count, 0) > 0`);
      }

      if (q && q.trim()) {
        whereClauses.push(`(
          p.name ILIKE $${paramIdx} OR
          p.sku ILIKE $${paramIdx} OR
          p.brand ILIKE $${paramIdx} OR
          p.short_description ILIKE $${paramIdx}
        )`);
        params.push(`%${q.trim()}%`);
        paramIdx++;
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Sorting
      let orderBySql = 'ORDER BY p.is_featured DESC, p.created_at DESC';
      if (sort === 'price-asc') orderBySql = 'ORDER BY p.price_ex_vat ASC';
      else if (sort === 'price-desc') orderBySql = 'ORDER BY p.price_ex_vat DESC';
      else if (sort === 'name-asc') orderBySql = 'ORDER BY p.name ASC';
      else if (sort === 'newest') orderBySql = 'ORDER BY p.created_at DESC';

      // Count total items
      const countSql = `
        SELECT COUNT(p.id)::int AS total
        FROM products p
        LEFT JOIN inventory inv ON inv.product_id = p.id
        ${whereSql};
      `;
      const countRes = await query<{ total: number }>(countSql, params);
      const total = countRes.rows[0]?.total || 0;

      // Select items with images, category names, and inventory
      const itemsSql = `
        SELECT 
          p.*,
          c.name AS category_name,
          sc.name AS subcategory_name,
          COALESCE(inv.stock_count, 0) AS stock_count,
          (COALESCE(inv.stock_count, 0) > 0) AS in_stock,
          (
            SELECT json_agg(img.image_url ORDER BY img.sort_order ASC)
            FROM product_images img
            WHERE img.product_id = p.id
          ) AS images
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN categories sc ON sc.id = p.subcategory_id
        LEFT JOIN inventory inv ON inv.product_id = p.id
        ${whereSql}
        ${orderBySql}
        LIMIT $${paramIdx++} OFFSET $${paramIdx++};
      `;
      const itemsRes = await query(itemsSql, [...params, limit, offset]);

      // Get Available Facets for current filter scope
      const facetSql = `
        SELECT 
          ARRAY_AGG(DISTINCT p.brand) FILTER (WHERE p.brand IS NOT NULL) AS brands,
          ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL) AS product_types,
          MIN(p.price_ex_vat) AS min_price,
          MAX(p.price_ex_vat) AS max_price
        FROM products p
        WHERE p.is_active = TRUE;
      `;
      const facetRes = await query(facetSql);
      const facets = facetRes.rows[0] || {};

      const totalPages = Math.ceil(total / limit);

      res.json({
        items: itemsRes.rows.map(formatProduct),
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        facets: {
          availableBrands: facets.brands || [],
          availableProductTypes: facets.product_types || [],
          priceRange: {
            min: parseFloat(facets.min_price || '0'),
            max: parseFloat(facets.max_price || '1000'),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/products/quick-lookup
 * Batch or single SKU lookup for Quick Order modal
 */
const quickLookupSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        sku: z.string().min(1),
        quantity: z.number().int().positive().default(1),
      })
    ).min(1),
  }),
});

productsRouter.post(
  '/quick-lookup',
  validate(quickLookupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items } = req.body;
      const skus = items.map((i: any) => i.sku.trim().toUpperCase());

      const sql = `
        SELECT 
          p.*,
          c.name AS category_name,
          sc.name AS subcategory_name,
          COALESCE(inv.stock_count, 0) AS stock_count,
          (COALESCE(inv.stock_count, 0) > 0) AS in_stock,
          (
            SELECT json_agg(img.image_url ORDER BY img.sort_order ASC)
            FROM product_images img
            WHERE img.product_id = p.id
          ) AS images
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN categories sc ON sc.id = p.subcategory_id
        LEFT JOIN inventory inv ON inv.product_id = p.id
        WHERE UPPER(p.sku) = ANY($1) AND p.is_active = TRUE;
      `;

      const { rows } = await query(sql, [skus]);
      const foundMap = new Map<string, any>();
      rows.forEach((r) => foundMap.set(r.sku.toUpperCase(), formatProduct(r)));

      const resolved: any[] = [];
      const unresolvedSkus: string[] = [];

      for (const item of items) {
        const key = item.sku.trim().toUpperCase();
        const product = foundMap.get(key);
        if (product) {
          resolved.push({
            sku: item.sku,
            product,
            requestedQty: item.quantity,
            availableStock: product.stockCount,
            isAvailable: product.inStock && product.stockCount >= item.quantity,
          });
        } else {
          unresolvedSkus.push(item.sku);
        }
      }

      res.json({
        resolved,
        unresolvedSkus,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/products/:slug
 * Full product detail with images, specifications, features, and inventory
 */
productsRouter.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const sql = `
      SELECT 
        p.*,
        c.name AS category_name,
        sc.name AS subcategory_name,
        COALESCE(inv.stock_count, 0) AS stock_count,
        (COALESCE(inv.stock_count, 0) > 0) AS in_stock,
        (
          SELECT json_agg(img.image_url ORDER BY img.sort_order ASC)
          FROM product_images img
          WHERE img.product_id = p.id
        ) AS images,
        (
          SELECT json_agg(feat.feature ORDER BY feat.sort_order ASC)
          FROM product_features feat
          WHERE feat.product_id = p.id
        ) AS features,
        (
          SELECT json_agg(
            json_build_object('name', spec.name, 'value', spec.value)
            ORDER BY spec.sort_order ASC
          )
          FROM product_specifications spec
          WHERE spec.product_id = p.id
        ) AS specifications
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN categories sc ON sc.id = p.subcategory_id
      LEFT JOIN inventory inv ON inv.product_id = p.id
      WHERE (p.slug = $1 OR p.id = $1) AND p.is_active = TRUE;
    `;

    const { rows } = await query(sql, [slug]);
    if (rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    res.json({ product: formatProduct(rows[0]) });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/products/:id/related
 * 4 related products in the same category
 */
productsRouter.get('/:id/related', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // First find current product's category
    const prodRes = await query('SELECT id, category_id FROM products WHERE id = $1 OR slug = $1;', [id]);
    if (prodRes.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }
    const currentProd = prodRes.rows[0];

    const sql = `
      SELECT 
        p.*,
        c.name AS category_name,
        sc.name AS subcategory_name,
        COALESCE(inv.stock_count, 0) AS stock_count,
        (COALESCE(inv.stock_count, 0) > 0) AS in_stock,
        (
          SELECT json_agg(img.image_url ORDER BY img.sort_order ASC)
          FROM product_images img
          WHERE img.product_id = p.id
        ) AS images
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN categories sc ON sc.id = p.subcategory_id
      LEFT JOIN inventory inv ON inv.product_id = p.id
      WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = TRUE
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT 4;
    `;

    const { rows } = await query(sql, [currentProd.category_id, currentProd.id]);

    res.json({
      related: rows.map(formatProduct),
    });
  } catch (error) {
    next(error);
  }
});
