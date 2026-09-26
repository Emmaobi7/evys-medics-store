import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';
import { DbCategory } from '../types/backend';

export const categoriesRouter = Router();

/**
 * GET /api/v1/categories
 * Returns active parent categories with item counts
 */
categoriesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.parent_id,
        c.sort_order,
        c.is_active,
        COUNT(p.id)::int AS item_count
      FROM categories c
      LEFT JOIN products p ON (p.category_id = c.id OR p.subcategory_id = c.id) AND p.is_active = TRUE
      WHERE c.parent_id IS NULL AND c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC;
    `;
    const { rows } = await query<DbCategory & { item_count: number }>(sql);

    res.json({
      categories: rows.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.image_url,
        itemCount: cat.item_count,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/categories/tree
 * Returns departments with nested subcategories (for Mega Menu & Navigation)
 */
categoriesRouter.get('/tree', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentSql = `
      SELECT id, name, slug, description, image_url, sort_order
      FROM categories
      WHERE parent_id IS NULL AND is_active = TRUE
      ORDER BY sort_order ASC, name ASC;
    `;
    const childSql = `
      SELECT id, name, slug, description, image_url, parent_id, sort_order
      FROM categories
      WHERE parent_id IS NOT NULL AND is_active = TRUE
      ORDER BY sort_order ASC, name ASC;
    `;

    const [parentsRes, childrenRes] = await Promise.all([
      query<DbCategory>(parentSql),
      query<DbCategory>(childSql),
    ]);

    const parents = parentsRes.rows;
    const children = childrenRes.rows;

    const tree = parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      description: parent.description,
      imageUrl: parent.image_url,
      subcategories: children
        .filter((child) => child.parent_id === parent.id)
        .map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
        })),
    }));

    res.json({ categories: tree });
  } catch (error) {
    next(error);
  }
});
