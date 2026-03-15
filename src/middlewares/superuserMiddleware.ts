import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const superuserMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'superuser') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  next();
};
