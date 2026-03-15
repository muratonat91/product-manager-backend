import pool from '../config/database';
import { Project } from '../types';

export const getProjects = async (userId: number): Promise<Project[]> => {
  const [rows]: any = await pool.query(
    `SELECT p.*, COUNT(pr.id) AS product_count,
            cc.name AS customer_chain_name,
            mt.category AS machine_category,
            mt.name AS machine_type_name
     FROM projects p
     LEFT JOIN products pr ON pr.project_id = p.id
     LEFT JOIN customer_chains cc ON cc.id = p.customer_chain_id
     LEFT JOIN machine_types mt ON mt.id = p.machine_type_id
     WHERE p.user_id = ?
     GROUP BY p.id, cc.name, mt.category, mt.name
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
};

export const getProjectById = async (id: number, userId: number): Promise<Project> => {
  const [rows]: any = await pool.query(
    `SELECT p.*,
            cc.name AS customer_chain_name,
            mt.category AS machine_category,
            mt.name AS machine_type_name
     FROM projects p
     LEFT JOIN customer_chains cc ON cc.id = p.customer_chain_id
     LEFT JOIN machine_types mt ON mt.id = p.machine_type_id
     WHERE p.id = ? AND p.user_id = ?`,
    [id, userId]
  );
  if (rows.length === 0) throw new Error('Project not found');
  return rows[0];
};

export const createProject = async (
  userId: number,
  customer_name: string,
  customer_location: string,
  description: string,
  job_no?: string,
  customer_chain_id?: number | null,
  machine_type_id?: number | null
): Promise<Project> => {
  const [result]: any = await pool.query(
    `INSERT INTO projects (user_id, customer_name, customer_location, description, job_no, customer_chain_id, machine_type_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, customer_name, customer_location, description, job_no || null, customer_chain_id || null, machine_type_id || null]
  );
  const id = result.insertId;
  const project_no = `M-${String(10000 + id).padStart(5, '0')}`;
  await pool.query('UPDATE projects SET project_no = ? WHERE id = ?', [project_no, id]);
  const [rows]: any = await pool.query(
    `SELECT p.*, cc.name AS customer_chain_name, mt.category AS machine_category, mt.name AS machine_type_name
     FROM projects p
     LEFT JOIN customer_chains cc ON cc.id = p.customer_chain_id
     LEFT JOIN machine_types mt ON mt.id = p.machine_type_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0];
};

export const updateProject = async (
  id: number,
  userId: number,
  customer_name: string,
  customer_location: string,
  description: string,
  job_no?: string,
  customer_chain_id?: number | null,
  machine_type_id?: number | null
): Promise<Project> => {
  const [result]: any = await pool.query(
    'UPDATE projects SET customer_name=?, customer_location=?, description=?, job_no=?, customer_chain_id=?, machine_type_id=?, updated_at=NOW() WHERE id=? AND user_id=?',
    [customer_name, customer_location, description, job_no || null, customer_chain_id || null, machine_type_id || null, id, userId]
  );
  if (result.affectedRows === 0) throw new Error('Project not found');
  const [rows]: any = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  return rows[0];
};

export const deleteProject = async (id: number, userId: number): Promise<void> => {
  const [result]: any = await pool.query('DELETE FROM projects WHERE id=? AND user_id=?', [id, userId]);
  if (result.affectedRows === 0) throw new Error('Project not found');
};
