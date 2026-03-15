import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { exportProjectExcel } from '../controllers/exportController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.get('/', projectController.getAll);
router.get('/:id/export/excel', exportProjectExcel);
router.get('/:id', projectController.getOne);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);
export default router;
