import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';

export const getPendingUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [rows]: any = await pool.query(
    'SELECT id, name, email, role, is_approved, created_at FROM users WHERE is_approved = 0 ORDER BY created_at ASC'
  );
  res.json(rows);
};

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [rows]: any = await pool.query(
    'SELECT id, name, email, role, is_approved, created_at FROM users ORDER BY created_at ASC'
  );
  res.json(rows);
};

export const approveUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const [result]: any = await pool.query(
    'UPDATE users SET is_approved = 1 WHERE id = ?',
    [id]
  );
  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const [rows]: any = await pool.query(
    'SELECT id, name, email, role, is_approved FROM users WHERE id = ?',
    [id]
  );
  res.json(rows[0]);
};

export const rejectUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const [result]: any = await pool.query(
    "DELETE FROM users WHERE id = ? AND role != 'admin'",
    [id]
  );
  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'User not found or cannot delete admin' });
    return;
  }
  res.json({ message: 'User deleted' });
};

export const getAllProjects = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [rows]: any = await pool.query(`
    SELECT p.*, u.name AS user_name, u.email AS user_email,
           COUNT(pr.id) AS product_count
    FROM projects p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.project_id = p.id
    GROUP BY p.id, u.name, u.email
    ORDER BY p.created_at DESC
  `);
  res.json(rows);
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const [result]: any = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
  if (result.affectedRows === 0) { res.status(404).json({ message: 'Project not found' }); return; }
  res.json({ message: 'Deleted' });
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const [result]: any = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  if (result.affectedRows === 0) { res.status(404).json({ message: 'Product not found' }); return; }
  res.json({ message: 'Deleted' });
};

export const setUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['user', 'superuser', 'admin'].includes(role)) {
    res.status(400).json({ message: 'Geçersiz rol' }); return;
  }
  const [result]: any = await pool.query(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, id]
  );
  if (result.affectedRows === 0) { res.status(404).json({ message: 'User not found' }); return; }
  const [rows]: any = await pool.query(
    'SELECT id, name, email, role, is_approved FROM users WHERE id = ?',
    [id]
  );
  res.json(rows[0]);
};

export const getProjectProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const [products]: any = await pool.query(
    'SELECT * FROM products WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  const result = [];
  for (const p of products) {
    const [images]: any = await pool.query('SELECT * FROM product_images WHERE product_id = ?', [p.id]);
    result.push({ ...p, images });
  }
  res.json(result);
};
