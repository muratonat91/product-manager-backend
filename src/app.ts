import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import productRoutes from './routes/products';
import adminRoutes from './routes/admin';
import userRoutes from './routes/users';

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

export default app;
