import pool from '../config/database';
import { Product } from '../types';

const ALLOWED_FIELDS = [
  'product_name', 'capacity', 'mix_type', 'no_of_flavor', 'weight_gr', 'volume_ml',
  'has_inclusion', 'inclusion_type', 'inclusion_size_mm',
  'filling_pattern', 'has_ripple_sauce', 'ripple_sauce_info',
  'l1', 'l2', 'width', 'thickness', 'diameter',
  'biscuit_l', 'biscuit_w', 'biscuit_thick', 'biscuit_diam',
  'stick_type', 'stick_length', 'stick_width', 'stick_thickness',
  'dipping_style', 'dipping_note', 'has_choc_tank_ingredients', 'choc_ingredient_type', 'choc_ingredient_size',
  'has_lid', 'lid1_type', 'lid1_is_stackable', 'lid2_type', 'lid2_is_stackable',
  'has_pencil_filler', 'pencil_filler_note', 'has_choc_disc',
  'has_liquid_sauce_topping', 'liquid_sauce_info',
  'has_dry_topping', 'dry_topping_info',
  'has_wrapper', 'wrapper_info', 'is_eol_included',
];

async function withImages(product: any): Promise<Product> {
  const images = await pool.query('SELECT * FROM product_images WHERE product_id=$1', [product.id]);
  return { ...product, images: images.rows };
}

export const getProductsByProject = async (projectId: number): Promise<Product[]> => {
  const products = await pool.query(
    'SELECT * FROM products WHERE project_id=$1 ORDER BY created_at DESC',
    [projectId]
  );
  return Promise.all(products.rows.map(withImages));
};

export const getAllProducts = async (name?: string, capacity?: string): Promise<Product[]> => {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: string[] = [];
  if (name) { params.push(`%${name}%`); query += ` AND product_name ILIKE $${params.length}`; }
  if (capacity) { params.push(`%${capacity}%`); query += ` AND capacity ILIKE $${params.length}`; }
  query += ' ORDER BY created_at DESC';
  const products = await pool.query(query, params);
  return Promise.all(products.rows.map(withImages));
};

export const createProduct = async (projectId: number, data: Record<string, any>, imagePaths: string[]): Promise<Product> => {
  if (!data.product_name || String(data.product_name).trim() === '') {
    throw new Error('Ürün adı zorunludur');
  }
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => ALLOWED_FIELDS.includes(k) && v !== undefined && v !== null && v !== '')
  );
  const fields = { project_id: projectId, ...filtered };
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO products (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  const product = result.rows[0];
  for (const imgPath of imagePaths) {
    await pool.query('INSERT INTO product_images (product_id, image_path) VALUES ($1, $2)', [product.id, imgPath]);
  }
  return withImages(product);
};

export const updateProduct = async (id: number, data: Record<string, any>): Promise<Product> => {
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
  if (Object.keys(filtered).length === 0) throw new Error('No fields to update');
  const keys = Object.keys(filtered);
  const values = Object.values(filtered);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const result = await pool.query(
    `UPDATE products SET ${setClause}, updated_at=NOW() WHERE id=$${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  if (result.rows.length === 0) throw new Error('Product not found');
  return withImages(result.rows[0]);
};

export const copyProduct = async (sourceId: number, targetProjectId: number): Promise<Product> => {
  const src = await pool.query('SELECT * FROM products WHERE id=$1', [sourceId]);
  if (!src.rows.length) throw new Error('Source product not found');
  const s = src.rows[0];

  const data = Object.fromEntries(
    ALLOWED_FIELDS.filter(f => s[f] !== null && s[f] !== undefined).map(f => [f, s[f]])
  );
  const fields = { project_id: targetProjectId, source_product_id: sourceId, ...data };
  const keys = Object.keys(fields);
  const vals = Object.values(fields);
  const ph = keys.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO products (${keys.join(', ')}) VALUES (${ph}) RETURNING *`, vals
  );
  const newProd = result.rows[0];
  const images = await pool.query('SELECT image_path FROM product_images WHERE product_id=$1', [sourceId]);
  for (const img of images.rows) {
    await pool.query('INSERT INTO product_images (product_id, image_path) VALUES ($1,$2)', [newProd.id, img.image_path]);
  }
  return withImages(newProd);
};

export const getProductUsage = async (productId: number): Promise<any[]> => {
  const result = await pool.query(
    `SELECT pr.id AS project_id, pr.customer_name, pr.customer_location,
            u.name AS user_name, p.created_at AS copied_at
     FROM products p
     JOIN projects pr ON pr.id = p.project_id
     JOIN users u ON u.id = pr.user_id
     WHERE p.source_product_id = $1
     ORDER BY p.created_at DESC`,
    [productId]
  );
  return result.rows;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await pool.query('DELETE FROM products WHERE id=$1', [id]);
};

export const deleteProductImage = async (imageId: number): Promise<void> => {
  await pool.query('DELETE FROM product_images WHERE id=$1', [imageId]);
};

export const addProductImages = async (productId: number, imagePaths: string[]): Promise<{ id: number; image_path: string }[]> => {
  const inserted: { id: number; image_path: string }[] = [];
  for (const imgPath of imagePaths) {
    const r = await pool.query(
      'INSERT INTO product_images (product_id, image_path) VALUES ($1, $2) RETURNING id, image_path',
      [productId, imgPath]
    );
    inserted.push(r.rows[0]);
  }
  return inserted;
};
