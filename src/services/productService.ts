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
  'machine_type', 'product_type',
  'to_be_commissioned', 'ice_cream_filling_type', 'total_volume',
  'percentage_of_inclusion', 'inclusion_other_note', 'notes',
  'no_of_lid', 'required_filling_station',
  'dry_topping_type', 'dry_topping_size',
  'ripple_sauce_pattern', 'ripple_pattern_other',
  'has_sauce_topping', 'sauce_topping_info',
  'cone_ee',
  'stick_size', 'coating_type', 'coating_type_other',
  'has_dry_coating', 'dry_coating_description', 'wrapper_description',
  'biscuit_type',
  'machine_size', 'dimension_state',
];

async function withImages(product: any): Promise<Product> {
  const [images]: any = await pool.query('SELECT * FROM product_images WHERE product_id = ?', [product.id]);
  return { ...product, images };
}

export const getProductsByProject = async (projectId: number): Promise<Product[]> => {
  const [products]: any = await pool.query(
    'SELECT * FROM products WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  return Promise.all(products.map(withImages));
};

export const getAllProducts = async (name?: string, capacity?: string): Promise<Product[]> => {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  if (name) { params.push(`%${name}%`); query += ` AND product_name LIKE ?`; }
  if (capacity) { params.push(`%${capacity}%`); query += ` AND capacity LIKE ?`; }
  query += ' ORDER BY created_at DESC';
  const [products]: any = await pool.query(query, params);
  return Promise.all(products.map(withImages));
};

export const createProduct = async (projectId: number, data: Record<string, any>, imagePaths: string[]): Promise<Product> => {
  if (!data.product_name || String(data.product_name).trim() === '') {
    throw new Error('Ürün adı zorunludur');
  }
  // Extract flavor volumes before filtering (flavor_volume_1, flavor_volume_2, ...)
  const flavorVolumes: { flavor_no: number; volume: number }[] = [];
  Object.entries(data).forEach(([k, v]) => {
    const m = k.match(/^flavor_volume_(\d+)$/);
    if (m && v !== '' && v !== undefined && v !== null) {
      flavorVolumes.push({ flavor_no: parseInt(m[1]), volume: parseInt(String(v)) });
    }
  });

  // Extract lid data (lid_1_style, lid_1_type, lid_1_style_other, ...)
  const lidNos = new Set<number>();
  Object.keys(data).forEach(k => { const m = k.match(/^lid_(\d+)_/); if (m) lidNos.add(parseInt(m[1])); });
  const lidData = Array.from(lidNos).map(n => ({
    lid_no: n,
    lid_style: String(data[`lid_${n}_style`] || ''),
    lid_style_other: String(data[`lid_${n}_style_other`] || ''),
    lid_type: String(data[`lid_${n}_type`] || ''),
  }));

  const filtered = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => ALLOWED_FIELDS.includes(k) && v !== undefined && v !== null && v !== '')
  );
  const fields = { project_id: projectId, ...filtered };
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const placeholders = keys.map(() => '?').join(', ');
  const [result]: any = await pool.query(
    `INSERT INTO products (${keys.join(', ')}) VALUES (${placeholders})`,
    values
  );
  const productId = result.insertId;
  const [productRows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
  const product = productRows[0];
  for (const imgPath of imagePaths) {
    await pool.query('INSERT INTO product_images (product_id, image_path) VALUES (?, ?)', [productId, imgPath]);
  }
  for (const fv of flavorVolumes) {
    await pool.query('INSERT INTO product_flavor_volumes (product_id, flavor_no, volume) VALUES (?, ?, ?)', [productId, fv.flavor_no, fv.volume]);
  }
  for (const lid of lidData) {
    await pool.query(
      'INSERT INTO product_lids (product_id, lid_no, lid_style, lid_style_other, lid_type) VALUES (?, ?, ?, ?, ?)',
      [productId, lid.lid_no, lid.lid_style, lid.lid_style_other, lid.lid_type]
    );
  }

  // Extract EOL pack patterns (eol_1_loader, eol_1_no_of_flavor, ...)
  const eolNos = new Set<number>();
  Object.keys(data).forEach(k => { const m = k.match(/^eol_(\d+)_/); if (m) eolNos.add(parseInt(m[1])); });
  for (const n of Array.from(eolNos)) {
    await pool.query(
      `INSERT INTO product_eol_pack_patterns
       (product_id, pattern_no, type_of_loader, loader_other_note, no_of_flavor, no_of_product_in_box, interleaved, no_of_layers, placement_rows, placement_cols)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId, n,
        data[`eol_${n}_loader`] || '',
        data[`eol_${n}_loader_other`] || '',
        parseInt(data[`eol_${n}_no_of_flavor`]) || null,
        parseInt(data[`eol_${n}_no_of_product_in_box`]) || null,
        data[`eol_${n}_interleaved`] === 'true' ? 1 : 0,
        parseInt(data[`eol_${n}_no_of_layers`]) || null,
        parseInt(data[`eol_${n}_placement_rows`]) || null,
        parseInt(data[`eol_${n}_placement_cols`]) || null,
      ]
    );
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
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const [result]: any = await pool.query(
    `UPDATE products SET ${setClause}, updated_at=NOW() WHERE id = ?`,
    [...values, id]
  );
  if (result.affectedRows === 0) throw new Error('Product not found');
  const [productRows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return withImages(productRows[0]);
};

export const copyProduct = async (sourceId: number, targetProjectId: number): Promise<Product> => {
  const [src]: any = await pool.query('SELECT * FROM products WHERE id = ?', [sourceId]);
  if (!src.length) throw new Error('Source product not found');
  const s = src[0];

  const data = Object.fromEntries(
    ALLOWED_FIELDS.filter(f => s[f] !== null && s[f] !== undefined).map(f => [f, s[f]])
  );
  const fields = { project_id: targetProjectId, source_product_id: sourceId, ...data };
  const keys = Object.keys(fields);
  const vals = Object.values(fields);
  const ph = keys.map(() => '?').join(', ');
  const [result]: any = await pool.query(
    `INSERT INTO products (${keys.join(', ')}) VALUES (${ph})`, vals
  );
  const [newProdRows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
  const newProd = newProdRows[0];
  const [images]: any = await pool.query('SELECT image_path FROM product_images WHERE product_id = ?', [sourceId]);
  for (const img of images) {
    await pool.query('INSERT INTO product_images (product_id, image_path) VALUES (?, ?)', [newProd.id, img.image_path]);
  }
  return withImages(newProd);
};

export const getProductUsage = async (productId: number): Promise<any[]> => {
  const [rows]: any = await pool.query(
    `SELECT pr.id AS project_id, pr.customer_name, pr.customer_location,
            u.name AS user_name, p.created_at AS copied_at
     FROM products p
     JOIN projects pr ON pr.id = p.project_id
     JOIN users u ON u.id = pr.user_id
     WHERE p.source_product_id = ?
     ORDER BY p.created_at DESC`,
    [productId]
  );
  return rows;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
};

export const deleteProductImage = async (imageId: number): Promise<void> => {
  await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
};

export const addProductImages = async (productId: number, imagePaths: string[]): Promise<{ id: number; image_path: string }[]> => {
  const inserted: { id: number; image_path: string }[] = [];
  for (const imgPath of imagePaths) {
    const [result]: any = await pool.query(
      'INSERT INTO product_images (product_id, image_path) VALUES (?, ?)',
      [productId, imgPath]
    );
    inserted.push({ id: result.insertId, image_path: imgPath });
  }
  return inserted;
};
