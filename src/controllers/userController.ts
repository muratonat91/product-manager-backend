import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    'SELECT id, name, surname, email, role, is_approved, phone, company, position, profile_photo, created_at FROM users WHERE id=$1',
    [req.user!.id]
  );
  if (result.rows.length === 0) { res.status(404).json({ message: 'User not found' }); return; }
  res.json(result.rows[0]);
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, surname, phone, company, position } = req.body;
  const uploadedFile = (req as any).file;

  let profile_photo: string | undefined;
  if (uploadedFile) {
    profile_photo = `/uploads/avatars/${uploadedFile.filename}`;
  } else if (req.body.profile_photo) {
    profile_photo = req.body.profile_photo;
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name=$${idx++}`); values.push(name); }
  if (surname !== undefined) { fields.push(`surname=$${idx++}`); values.push(surname); }
  if (phone !== undefined) { fields.push(`phone=$${idx++}`); values.push(phone); }
  if (company !== undefined) { fields.push(`company=$${idx++}`); values.push(company); }
  if (position !== undefined) { fields.push(`position=$${idx++}`); values.push(position); }
  if (profile_photo !== undefined) { fields.push(`profile_photo=$${idx++}`); values.push(profile_photo); }

  if (fields.length === 0) { res.status(400).json({ message: 'No fields to update' }); return; }

  values.push(req.user!.id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, name, surname, email, role, is_approved, phone, company, position, profile_photo, created_at`,
    values
  );
  res.json(result.rows[0]);
};
