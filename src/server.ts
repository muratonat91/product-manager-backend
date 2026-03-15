import 'dotenv/config';
import app from './app';
import { initDB } from './config/database';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const start = async () => {
  await initDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start().catch(console.error);
