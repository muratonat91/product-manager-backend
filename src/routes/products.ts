import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as productController from '../controllers/productController';
import { authMiddleware } from '../middlewares/auth';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);
router.get('/search', productController.searchAll);
router.get('/project/:projectId', productController.getByProject);
router.post('/', upload.array('images', 10), productController.create);
router.delete('/image/:imageId', productController.removeImage);
router.get('/:id/usage', productController.usage);
router.post('/:id/copy', productController.copy);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);
export default router;
