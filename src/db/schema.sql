CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(150) NOT NULL,
  customer_location VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_name VARCHAR(150) NOT NULL,
  capacity VARCHAR(100),
  mix_type VARCHAR(100),
  no_of_flavor INTEGER,
  weight_gr FLOAT,
  volume_ml FLOAT,
  has_inclusion BOOLEAN NOT NULL DEFAULT false,
  inclusion_type VARCHAR(150),
  inclusion_size_mm FLOAT,
  filling_pattern VARCHAR(150),
  has_ripple_sauce BOOLEAN NOT NULL DEFAULT false,
  ripple_sauce_info TEXT,
  l1 FLOAT, l2 FLOAT, width FLOAT, thickness FLOAT, diameter FLOAT,
  biscuit_l FLOAT, biscuit_w FLOAT, biscuit_thick FLOAT, biscuit_diam FLOAT,
  stick_type VARCHAR(100), stick_length FLOAT, stick_width FLOAT, stick_thickness FLOAT,
  dipping_style VARCHAR(100), dipping_note TEXT,
  has_choc_tank_ingredients BOOLEAN NOT NULL DEFAULT false,
  choc_ingredient_type VARCHAR(150), choc_ingredient_size FLOAT,
  has_lid BOOLEAN NOT NULL DEFAULT false,
  lid1_type VARCHAR(100), lid1_is_stackable BOOLEAN NOT NULL DEFAULT false,
  lid2_type VARCHAR(100), lid2_is_stackable BOOLEAN NOT NULL DEFAULT false,
  has_pencil_filler BOOLEAN NOT NULL DEFAULT false, pencil_filler_note TEXT,
  has_choc_disc BOOLEAN NOT NULL DEFAULT false,
  has_liquid_sauce_topping BOOLEAN NOT NULL DEFAULT false, liquid_sauce_info TEXT,
  has_dry_topping BOOLEAN NOT NULL DEFAULT false, dry_topping_info TEXT,
  has_wrapper BOOLEAN NOT NULL DEFAULT false, wrapper_info TEXT,
  is_eol_included BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS capacity VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS mix_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS no_of_flavor INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_gr FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_ml FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_inclusion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inclusion_type VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS inclusion_size_mm FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS filling_pattern VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_ripple_sauce BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ripple_sauce_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS l1 FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS l2 FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS thickness FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS diameter FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS biscuit_l FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS biscuit_w FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS biscuit_thick FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS biscuit_diam FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stick_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stick_length FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stick_width FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stick_thickness FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dipping_style VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dipping_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_choc_tank_ingredients BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS choc_ingredient_type VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS choc_ingredient_size FLOAT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_lid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lid1_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS lid1_is_stackable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lid2_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS lid2_is_stackable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_pencil_filler BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pencil_filler_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_choc_disc BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_liquid_sauce_topping BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS liquid_sauce_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_dry_topping BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dry_topping_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_wrapper BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wrapper_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_eol_included BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE products ADD COLUMN IF NOT EXISTS source_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
