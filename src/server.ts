import 'dotenv/config';
import app from './app';
import { initDB } from './config/database';
import { runBackup } from './services/backupService';
import logger from './utils/logger';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const start = async () => {
  for (let i = 0; i < 10; i++) {
    try {
      await initDB();
      break;
    } catch (err: any) {
      if (i === 9) throw err;
      logger.warn(`DB not ready, retrying in 3s... (${i + 1}/10)`);
      await wait(3000);
    }
  }

  // Weekly backup: every Sunday at 02:00 AM
  cron.schedule('0 2 * * 0', async () => {
    logger.info('Weekly backup started...');
    try {
      const file = await runBackup();
      logger.info(`Weekly backup completed: ${path.basename(file)}`);
    } catch (err: any) {
      logger.error(`Weekly backup failed: ${err.message}`);
    }
  });

  logger.info('Cron job scheduled: weekly DB backup every Sunday at 02:00');

  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
};

start().catch(err => {
  logger.error(`Fatal startup error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
