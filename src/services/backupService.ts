import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import logger from '../utils/logger';

const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 10;

const TABLES = ['users', 'customer_chains', 'machine_types', 'projects', 'products', 'product_images'];

function sanitizeUsers(rows: any[]): any[] {
  return rows.map(({ password, ...rest }) => rest);
}

export const runBackup = async (): Promise<string> => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  const backup: Record<string, any[]> = {};

  for (const table of TABLES) {
    const [rows]: any = await pool.query(`SELECT * FROM ${table}`);
    backup[table] = table === 'users' ? sanitizeUsers(rows) : rows;
  }

  backup._meta = {
    created_at: new Date().toISOString(),
    tables: TABLES,
    row_counts: Object.fromEntries(TABLES.map(t => [t, backup[t].length])),
  } as any;

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');
  logger.info(`Backup created: ${filename}`, { rows: backup._meta });

  // Keep only the last MAX_BACKUPS files
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .sort();

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(0, files.length - MAX_BACKUPS);
    for (const f of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      logger.info(`Old backup deleted: ${f}`);
    }
  }

  return filepath;
};
