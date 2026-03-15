import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { superuserMiddleware } from '../middlewares/superuserMiddleware';
import { getPendingUsers, getAllUsers, approveUser, rejectUser, getAllProjects, getProjectProducts, deleteProject, deleteProduct, setUserRole } from '../controllers/adminController';

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

export default router;
