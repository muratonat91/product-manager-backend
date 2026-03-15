import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { getPendingUsers, getAllUsers, approveUser, rejectUser, getAllProjects, getProjectProducts, deleteProject, deleteProduct } from '../controllers/adminController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users/pending', getPendingUsers);
router.get('/users', getAllUsers);
router.patch('/users/:id/approve', approveUser);
router.delete('/users/:id', rejectUser);
router.get('/projects', getAllProjects);
router.get('/projects/:projectId/products', getProjectProducts);
router.delete('/projects/:id', deleteProject);
router.delete('/products/:id', deleteProduct);

export default router;
