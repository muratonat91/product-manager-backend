import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { superuserMiddleware } from '../middlewares/superuserMiddleware';
import { getPendingUsers, getAllUsers, approveUser, rejectUser, getAllProjects, getProjectProducts, deleteProject, deleteProduct, setUserRole } from '../controllers/adminController';
import pool from '../config/database';
import { runBackup } from '../services/backupService';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

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

// Customer chains
router.get('/chains', superuserMiddleware, async (req, res) => {
  const [rows]: any = await pool.query('SELECT * FROM customer_chains ORDER BY name ASC');
  res.json(rows);
});
router.post('/chains', adminMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ message: 'Name required' }); return; }
  await pool.query('INSERT IGNORE INTO customer_chains (name) VALUES (?)', [name]);
  const [rows]: any = await pool.query('SELECT * FROM customer_chains WHERE name = ?', [name]);
  res.json(rows[0]);
});
router.delete('/chains/:id', adminMiddleware, async (req, res) => {
  await pool.query('DELETE FROM customer_chains WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// Machine types
router.get('/machine-types', superuserMiddleware, async (req, res) => {
  const [rows]: any = await pool.query('SELECT * FROM machine_types ORDER BY category ASC, name ASC');
  res.json(rows);
});
router.post('/machine-types', adminMiddleware, async (req, res) => {
  const { category, name } = req.body;
  if (!category || !name) { res.status(400).json({ message: 'Category and name required' }); return; }
  await pool.query('INSERT IGNORE INTO machine_types (category, name) VALUES (?, ?)', [category, name]);
  const [rows]: any = await pool.query('SELECT * FROM machine_types WHERE category = ? AND name = ?', [category, name]);
  res.json(rows[0]);
});
router.delete('/machine-types/:id', adminMiddleware, async (req, res) => {
  await pool.query('DELETE FROM machine_types WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ─── System: Backup & Logs ────────────────────────────────────────────────────
const BACKUP_DIR = path.join(__dirname, '../../backups');
const LOGS_DIR   = path.join(__dirname, '../../logs');

function fileList(dir: string, ext: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => {
      const stat = fs.statSync(path.join(dir, f));
      return { name: f, size: stat.size, modified: stat.mtime };
    })
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
}

// Trigger manual backup
router.post('/system/backup', adminMiddleware, async (req, res) => {
  try {
    const file = await runBackup();
    logger.info('Manual backup triggered via admin panel');
    res.json({ message: 'Backup created', file: path.basename(file) });
  } catch (err: any) {
    logger.error(`Manual backup failed: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// List backup files
router.get('/system/backups', adminMiddleware, (req, res) => {
  res.json(fileList(BACKUP_DIR, '.json'));
});

// Download a backup file
router.get('/system/backups/:filename', adminMiddleware, (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) { res.status(404).json({ message: 'File not found' }); return; }
  res.download(filepath);
});

// List log files
router.get('/system/logs', adminMiddleware, (req, res) => {
  const all = [
    ...fileList(LOGS_DIR, '.log'),
    ...fileList(LOGS_DIR, '.log.gz'),
  ].sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
  res.json(all);
});

// Download a log file
router.get('/system/logs/:filename', adminMiddleware, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(LOGS_DIR, filename);
  if (!fs.existsSync(filepath)) { res.status(404).json({ message: 'File not found' }); return; }
  res.download(filepath);
});

// Live log stream (SSE) — token accepted via ?token= query param for EventSource
router.get('/system/logs/stream/live', adminMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if behind proxy
  res.flushHeaders();

  const send = (data: string) => {
    if (res.writableEnded) return;
    // send each non-empty line as a separate SSE event
    data.split('\n').forEach(line => {
      if (line.trim()) res.write(`data: ${line}\n\n`);
    });
  };

  // Send last 100 lines of today's app log on connect
  const today = new Date().toISOString().slice(0, 10);
  const logFile = path.join(LOGS_DIR, `app-${today}.log`);
  if (fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean).slice(-100);
    lines.forEach(line => res.write(`data: ${line}\n\n`));
  }

  let fileSize = fs.existsSync(logFile) ? fs.statSync(logFile).size : 0;

  // Watch the logs directory for new writes
  const watcher = fs.watch(LOGS_DIR, (event, filename) => {
    if (!filename || !filename.startsWith('app-') || !filename.endsWith('.log')) return;
    const fp = path.join(LOGS_DIR, filename);
    if (!fs.existsSync(fp)) return;
    const newSize = fs.statSync(fp).size;
    if (newSize <= fileSize) return;
    const buf = Buffer.alloc(newSize - fileSize);
    const fd = fs.openSync(fp, 'r');
    fs.readSync(fd, buf, 0, buf.length, fileSize);
    fs.closeSync(fd);
    fileSize = newSize;
    send(buf.toString('utf8'));
  });

  // Keepalive ping every 25s so the connection doesn't time out
  const ping = setInterval(() => { if (!res.writableEnded) res.write(': ping\n\n'); }, 25000);

  req.on('close', () => {
    watcher.close();
    clearInterval(ping);
  });
});

export default router;
