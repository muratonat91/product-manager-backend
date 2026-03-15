import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { User } from '../types';

export const registerUser = async (
  name: string,
  surname: string | undefined,
  email: string,
  password: string,
  phone?: string,
  company?: string,
  position?: string,
  profile_photo?: string,
  preferred_language?: string
): Promise<Omit<User, 'password'>> => {
  const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (exists.rows.length > 0) throw new Error('Email already in use');
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, surname, email, password, phone, company, position, profile_photo, preferred_language)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, surname, email, role, is_approved, phone, company, position, profile_photo, preferred_language, created_at`,
    [name, surname || null, email, hash, phone || null, company || null, position || null, profile_photo || null, preferred_language || 'tr']
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
  return {
    token,
    user: {
      id: user.id, name: user.name, surname: user.surname, email: user.email,
      role: user.role, is_approved: user.is_approved,
      phone: user.phone, company: user.company, position: user.position,
      profile_photo: user.profile_photo, preferred_language: user.preferred_language,
      created_at: user.created_at
    }
  };
};
