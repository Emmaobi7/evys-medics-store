import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';

export const searchRouter = Router();

/**
 * GET /api/v1/search/suggest
 * Quick suggestions for search overlay dropdown
 */
searchRouter.get('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ products: [], categories: [] });
    }

    const searchTerm = `%${q}%`;

    // 1. Suggest Products (Max 6)
    const productSql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.slug,
        p.price_ex_vat,
        p.short_description,
        c.name AS category_name,
        (
          SELECT img.image_url 
          FROM product_images img 
          WHERE img.product_id = p.id 
          ORDER BY img.sort_order ASC 
          LIMIT 1
        ) AS image_url
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE (
        p.name ILIKE $1 OR
        p.sku ILIKE $1 OR
        p.brand ILIKE $1 OR
        p.short_description ILIKE $1
      ) AND p.is_active = TRUE
      LIMIT 6;
    `;

    // 2. Suggest Categories / Subcategories
    const categorySql = `
      SELECT id, name, slug, parent_id
      FROM categories
      WHERE name ILIKE $1 AND is_active = TRUE
      LIMIT 4;
    `;

    const [prodRes, catRes] = await Promise.all([
      query(productSql, [searchTerm]),
      query(categorySql, [searchTerm]),
    ]);

    const products = prodRes.rows.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      slug: row.slug,
      price: parseFloat(row.price_ex_vat),
      categoryName: row.category_name,
      shortDescription: row.short_description,
      imageUrl: row.image_url,
    }));

    const categories = catRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isSubcategory: Boolean(row.parent_id),
    }));

    res.json({ products, categories });
  } catch (error) {
    next(error);
  }
});
