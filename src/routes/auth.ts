import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as authController from '../controllers/authController';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/avatars')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.post('/register', upload.single('profile_photo'), authController.register);
router.post('/login', authController.login);
export default router;
