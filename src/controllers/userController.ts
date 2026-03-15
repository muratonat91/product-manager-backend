import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const [rows]: any = await pool.query(
    'SELECT id, name, surname, email, role, is_approved, phone, company, position, profile_photo, preferred_language, created_at FROM users WHERE id = ?',
    [req.user!.id]
  );
  if (rows.length === 0) { res.status(404).json({ message: 'User not found' }); return; }
  res.json(rows[0]);
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, surname, phone, company, position, preferred_language } = req.body;
  const uploadedFile = (req as any).file;

  let profile_photo: string | undefined;
  if (uploadedFile) {
    profile_photo = `/uploads/avatars/${uploadedFile.filename}`;
  } else if (req.body.profile_photo) {
    profile_photo = req.body.profile_photo;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (surname !== undefined) { fields.push('surname = ?'); values.push(surname); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (company !== undefined) { fields.push('company = ?'); values.push(company); }
  if (position !== undefined) { fields.push('position = ?'); values.push(position); }
  if (profile_photo !== undefined) { fields.push('profile_photo = ?'); values.push(profile_photo); }
  if (preferred_language !== undefined) { fields.push('preferred_language = ?'); values.push(preferred_language); }

  if (fields.length === 0) { res.status(400).json({ message: 'No fields to update' }); return; }

  values.push(req.user!.id);
  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  const [rows]: any = await pool.query(
    'SELECT id, name, surname, email, role, is_approved, phone, company, position, profile_photo, preferred_language, created_at FROM users WHERE id = ?',
    [req.user!.id]
  );
  res.json(rows[0]);
};
