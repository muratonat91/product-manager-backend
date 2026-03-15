import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'projectdb',
  waitForConnections: true,
  connectionLimit: 10,
  typeCast: (field: any, next: any) => {
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1';
    }
    return next();
  },
});

export const initDB = async () => {
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  const statements = schema.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log('Database initialized');

  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (name, email, password, role, is_approved)
     VALUES ('Admin', 'admin@admin.com', ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE role = 'admin', is_approved = 1`,
    [hash]
  );
  console.log('Admin seeder done');
};

export default pool;
