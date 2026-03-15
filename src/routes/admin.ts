import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { superuserMiddleware } from '../middlewares/superuserMiddleware';
import { getPendingUsers, getAllUsers, approveUser, rejectUser, getAllProjects, getProjectProducts, deleteProject, deleteProduct, setUserRole } from '../controllers/adminController';
import pool from '../config/database';

const router = Router();
router.use(authMiddleware);

// Admin-only: user management & destructive actions
router.get('/users/pending',        adminMiddleware, getPendingUsers);
router.get('/users',                adminMiddleware, getAllUsers);
router.patch('/users/:id/approve',  adminMiddleware, approveUser);
router.delete('/users/:id',         adminMiddleware, rejectUser);
router.patch('/users/:id/role',     adminMiddleware, setUserRole);
router.delete('/projects/:id',      adminMiddleware, deleteProject);
router.delete('/products/:id',      adminMiddleware, deleteProduct);

// Admin + superuser: read-only project/product views
router.get('/projects',                       superuserMiddleware, getAllProjects);
router.get('/projects/:projectId/products',   superuserMiddleware, getProjectProducts);

// Customer chains
router.get('/chains', superuserMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM customer_chains ORDER BY name ASC');
  res.json(rows);
});
router.post('/chains', adminMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ message: 'Name required' }); return; }
  const { rows } = await pool.query('INSERT INTO customer_chains (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *', [name]);
  res.json(rows[0] || { message: 'Already exists' });
});
router.delete('/chains/:id', adminMiddleware, async (req, res) => {
  await pool.query('DELETE FROM customer_chains WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// Machine types
router.get('/machine-types', superuserMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM machine_types ORDER BY category ASC, name ASC');
  res.json(rows);
});
router.post('/machine-types', adminMiddleware, async (req, res) => {
  const { category, name } = req.body;
  if (!category || !name) { res.status(400).json({ message: 'Category and name required' }); return; }
  const { rows } = await pool.query('INSERT INTO machine_types (category, name) VALUES ($1, $2) ON CONFLICT (category, name) DO NOTHING RETURNING *', [category, name]);
  res.json(rows[0] || { message: 'Already exists' });
});
router.delete('/machine-types/:id', adminMiddleware, async (req, res) => {
  await pool.query('DELETE FROM machine_types WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

export default router;
