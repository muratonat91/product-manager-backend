import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, surname, email, password, phone, company, position, preferred_language } = req.body;
    const uploadedFile = (req as any).file;
    const profile_photo = uploadedFile
      ? `/uploads/avatars/${uploadedFile.filename}`
      : req.body.profile_photo || null;

    const user = await authService.registerUser(name, surname, email, password, phone, company, position, profile_photo, preferred_language);
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
