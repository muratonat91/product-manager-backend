import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/projectdb',
});

export const initDB = async () => {
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database initialized');

  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (name, email, password, role, is_approved)
     VALUES ('Admin', 'admin@admin.com', $1, 'admin', true)
     ON CONFLICT (email) DO UPDATE SET role = 'admin', is_approved = true`,
    [hash]
  );
  console.log('Admin seeder done');
};

export default pool;
