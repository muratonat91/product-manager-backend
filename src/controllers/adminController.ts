import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';

export const getPendingUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    'SELECT id, name, email, role, is_approved, created_at FROM users WHERE is_approved = false ORDER BY created_at ASC'
  );
  res.json(result.rows);
};

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    'SELECT id, name, email, role, is_approved, created_at FROM users ORDER BY created_at ASC'
  );
  res.json(result.rows);
};

export const approveUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await pool.query(
    'UPDATE users SET is_approved = true WHERE id = $1 RETURNING id, name, email, role, is_approved',
    [id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(result.rows[0]);
};

export const rejectUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM users WHERE id = $1 AND role != $2 RETURNING id', [id, 'admin']);
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'User not found or cannot delete admin' });
    return;
  }
  res.json({ message: 'User deleted' });
};

export const getAllProjects = async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(`
    SELECT p.*, u.name AS user_name, u.email AS user_email,
           COUNT(pr.id)::int AS product_count
    FROM projects p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.project_id = p.id
    GROUP BY p.id, u.name, u.email
    ORDER BY p.created_at DESC
  `);
  res.json(result.rows);
};

export const getProjectProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const products = await pool.query(
    'SELECT * FROM products WHERE project_id=$1 ORDER BY created_at DESC',
    [projectId]
  );
  const result = [];
  for (const p of products.rows) {
    const images = await pool.query('SELECT * FROM product_images WHERE product_id=$1', [p.id]);
    result.push({ ...p, images: images.rows });
  }
  res.json(result);
};
