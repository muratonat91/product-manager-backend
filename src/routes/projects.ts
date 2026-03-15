import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { exportProjectExcel } from '../controllers/exportController';
import { authMiddleware } from '../middlewares/auth';
import pool from '../config/database';

const router = Router();
router.use(authMiddleware);

// Lookup endpoints - available to all authenticated users
router.get('/lookup/chains', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM customer_chains ORDER BY name ASC');
  res.json(rows);
});
router.get('/lookup/machine-types', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM machine_types ORDER BY category ASC, name ASC');
  res.json(rows);
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(DISTINCT customer_name) FROM projects WHERE customer_name IS NOT NULL) AS customers
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Stats error' });
  }
});

router.get('/', projectController.getAll);
router.get('/:id/export/excel', exportProjectExcel);
router.get('/:id', projectController.getOne);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);
export default router;
