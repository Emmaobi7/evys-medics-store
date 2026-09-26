import { pool } from './connection';
import { config } from '../config/env';
import { MEGA_MENU_CATEGORIES } from '../../../src/data/categories';
import { PRODUCTS } from '../../../src/data/products';

export async function seedDatabase() {
  console.log(`[DB Seed] Seeding development mock data into schema "${config.dbSchema}"...`);
  console.log('[DB Seed] NOTE: This data is for DEVELOPMENT / DEMO purposes only.');
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Clear existing development seed data cleanly
    await client.query(`
      TRUNCATE TABLE order_items, orders, product_specifications, product_features, product_images, inventory, products, categories CASCADE;
    `);

    // 2. Insert Categories & Subcategories from MEGA_MENU_CATEGORIES
    console.log('[DB Seed] Inserting categories & subcategories...');
    for (let i = 0; i < MEGA_MENU_CATEGORIES.length; i++) {
      const cat = MEGA_MENU_CATEGORIES[i];
      // Main parent category
      await client.query(
        `
        INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, NULL, $6, TRUE)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          sort_order = EXCLUDED.sort_order;
        `,
        [cat.id, cat.name, cat.id, cat.description, cat.imageUrl, i]
      );

      // Subcategories
      if (cat.subcategories && cat.subcategories.length > 0) {
        for (let j = 0; j < cat.subcategories.length; j++) {
          const sub = cat.subcategories[j];
          await client.query(
            `
            INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active)
            VALUES ($1, $2, $3, $4, NULL, $5, $6, TRUE)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              parent_id = EXCLUDED.parent_id,
              sort_order = EXCLUDED.sort_order;
            `,
            [sub.id, sub.name, sub.id, `${sub.name} in ${cat.name}`, cat.id, j]
          );
        }
      }
    }

    // Ensure any extra subcategories mentioned in PRODUCTS exist in categories
    for (const prod of PRODUCTS) {
      if (prod.subcategory) {
        const subName = prod.subcategoryName || prod.subcategory.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        await client.query(
          `
          INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active)
          VALUES ($1, $2, $3, $4, NULL, $5, 99, TRUE)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            parent_id = COALESCE(categories.parent_id, EXCLUDED.parent_id);
          `,
          [prod.subcategory, subName, prod.subcategory, `${subName} in ${prod.categoryName || prod.category}`, prod.category]
        );
      }
    }

    // 3. Insert Products
    console.log(`[DB Seed] Inserting ${PRODUCTS.length} products with normalized relations...`);
    for (const prod of PRODUCTS) {
      // Join description array into paragraphs or text
      const fullDescription = Array.isArray(prod.description)
        ? prod.description.join('\n\n')
        : prod.description || '';

      await client.query(
        `
        INSERT INTO products (
          id, sku, name, slug, category_id, subcategory_id, brand,
          short_description, description, product_type, price_ex_vat,
          compare_at_price_ex_vat, vat_rate, lead_time, is_active, is_featured
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          sku = EXCLUDED.sku,
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          category_id = EXCLUDED.category_id,
          subcategory_id = EXCLUDED.subcategory_id,
          brand = EXCLUDED.brand,
          short_description = EXCLUDED.short_description,
          description = EXCLUDED.description,
          product_type = EXCLUDED.product_type,
          price_ex_vat = EXCLUDED.price_ex_vat,
          compare_at_price_ex_vat = EXCLUDED.compare_at_price_ex_vat,
          vat_rate = EXCLUDED.vat_rate,
          lead_time = EXCLUDED.lead_time,
          is_active = EXCLUDED.is_active,
          is_featured = EXCLUDED.is_featured;
        `,
        [
          prod.id,
          prod.sku,
          prod.name,
          prod.slug,
          prod.category,
          prod.subcategory || null,
          prod.brand || "Evy's Projects",
          prod.shortDescription || '',
          fullDescription,
          prod.productType || null,
          prod.price,
          prod.compareAtPrice || null,
          0.20, // default UK VAT rate 20%
          prod.leadTime || 'Standard Courier Dispatch',
          prod.inStock !== false,
          Boolean(prod.isFeatured),
        ]
      );

      // Insert Images
      if (prod.images && prod.images.length > 0) {
        for (let imgIdx = 0; imgIdx < prod.images.length; imgIdx++) {
          await client.query(
            `
            INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
            VALUES ($1, $2, $3, $4);
            `,
            [prod.id, prod.images[imgIdx], `${prod.name} image ${imgIdx + 1}`, imgIdx]
          );
        }
      }

      // Insert Features
      if (prod.features && prod.features.length > 0) {
        for (let featIdx = 0; featIdx < prod.features.length; featIdx++) {
          await client.query(
            `
            INSERT INTO product_features (product_id, feature, sort_order)
            VALUES ($1, $2, $3);
            `,
            [prod.id, prod.features[featIdx], featIdx]
          );
        }
      }

      // Insert Specifications
      if (prod.specifications && prod.specifications.length > 0) {
        for (let specIdx = 0; specIdx < prod.specifications.length; specIdx++) {
          const spec = prod.specifications[specIdx];
          await client.query(
            `
            INSERT INTO product_specifications (product_id, name, value, sort_order)
            VALUES ($1, $2, $3, $4);
            `,
            [prod.id, spec.name, spec.value, specIdx]
          );
        }
      }

      // Insert Authoritative Inventory
      await client.query(
        `
        INSERT INTO inventory (product_id, stock_count, track_inventory)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (product_id) DO UPDATE SET
          stock_count = EXCLUDED.stock_count,
          track_inventory = EXCLUDED.track_inventory,
          updated_at = NOW();
        `,
        [prod.id, prod.stockCount ?? (prod.inStock ? 25 : 0)]
      );
    }

    await client.query('COMMIT');
    console.log('[DB Seed] Seed completed successfully with mock development catalog.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[DB Seed Error]:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ESM direct execution check
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => {
      console.log('[DB Seed] Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Seed Failed]:', err);
      process.exit(1);
    });
}
