import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { User } from '../types';

export const registerUser = async (name: string, email: string, password: string): Promise<Omit<User, 'password'>> => {
  const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (exists.rows.length > 0) throw new Error('Email already in use');
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, hash]
  );
  return result.rows[0];
};

export const loginUser = async (email: string, password: string): Promise<{ token: string; user: Omit<User, 'password'> }> => {
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (result.rows.length === 0) throw new Error('Invalid credentials');
  const user: User = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  if (!user.is_approved) throw new Error('PENDING_APPROVAL');
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '7d' });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, is_approved: user.is_approved, created_at: user.created_at } };
};
