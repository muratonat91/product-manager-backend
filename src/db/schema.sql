CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  phone VARCHAR(50),
  company VARCHAR(150),
  position VARCHAR(150),
  profile_photo VARCHAR(500),
  preferred_language VARCHAR(10) DEFAULT 'tr',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_chains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS machine_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  UNIQUE KEY uq_cat_name (category, name)
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_location VARCHAR(200),
  description TEXT,
  job_no VARCHAR(100),
  customer_chain_id INT,
  machine_type_id INT,
  project_no VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_chain_id) REFERENCES customer_chains(id) ON DELETE SET NULL,
  FOREIGN KEY (machine_type_id) REFERENCES machine_types(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  capacity VARCHAR(100),
  mix_type VARCHAR(100),
  no_of_flavor INT,
  weight_gr FLOAT,
  volume_ml FLOAT,
  has_inclusion TINYINT(1) NOT NULL DEFAULT 0,
  inclusion_type VARCHAR(150),
  inclusion_size_mm FLOAT,
  filling_pattern VARCHAR(150),
  has_ripple_sauce TINYINT(1) NOT NULL DEFAULT 0,
  ripple_sauce_info TEXT,
  l1 FLOAT, l2 FLOAT, width FLOAT, thickness FLOAT, diameter FLOAT,
  biscuit_l FLOAT, biscuit_w FLOAT, biscuit_thick FLOAT, biscuit_diam FLOAT,
  stick_type VARCHAR(100), stick_length FLOAT, stick_width FLOAT, stick_thickness FLOAT,
  dipping_style VARCHAR(100), dipping_note TEXT,
  has_choc_tank_ingredients TINYINT(1) NOT NULL DEFAULT 0,
  choc_ingredient_type VARCHAR(150), choc_ingredient_size FLOAT,
  has_lid TINYINT(1) NOT NULL DEFAULT 0,
  lid1_type VARCHAR(100), lid1_is_stackable TINYINT(1) NOT NULL DEFAULT 0,
  lid2_type VARCHAR(100), lid2_is_stackable TINYINT(1) NOT NULL DEFAULT 0,
  has_pencil_filler TINYINT(1) NOT NULL DEFAULT 0, pencil_filler_note TEXT,
  has_choc_disc TINYINT(1) NOT NULL DEFAULT 0,
  has_liquid_sauce_topping TINYINT(1) NOT NULL DEFAULT 0, liquid_sauce_info TEXT,
  has_dry_topping TINYINT(1) NOT NULL DEFAULT 0, dry_topping_info TEXT,
  has_wrapper TINYINT(1) NOT NULL DEFAULT 0, wrapper_info TEXT,
  is_eol_included TINYINT(1) NOT NULL DEFAULT 0,
  source_product_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
