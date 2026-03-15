import pool from '../config/database';
import { Project } from '../types';

export const getProjects = async (userId: number): Promise<Project[]> => {
  const result = await pool.query(
    `SELECT p.*, COUNT(pr.id)::int AS product_count,
            cc.name AS customer_chain_name,
            mt.category AS machine_category,
            mt.name AS machine_type_name
     FROM projects p
     LEFT JOIN products pr ON pr.project_id = p.id
     LEFT JOIN customer_chains cc ON cc.id = p.customer_chain_id
     LEFT JOIN machine_types mt ON mt.id = p.machine_type_id
     WHERE p.user_id = $1
     GROUP BY p.id, cc.name, mt.category, mt.name
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getProjectById = async (id: number, userId: number): Promise<Project> => {
  const result = await pool.query(
    `SELECT p.*,
            cc.name AS customer_chain_name,
            mt.category AS machine_category,
            mt.name AS machine_type_name
     FROM projects p
     LEFT JOIN customer_chains cc ON cc.id = p.customer_chain_id
     LEFT JOIN machine_types mt ON mt.id = p.machine_type_id
     WHERE p.id=$1 AND p.user_id=$2`,
    [id, userId]
  );
  if (result.rows.length === 0) throw new Error('Project not found');
  return result.rows[0];
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
  const result = await pool.query(
    'INSERT INTO projects (user_id, customer_name, customer_location, description, job_no, customer_chain_id, machine_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [userId, customer_name, customer_location, description, job_no || null, customer_chain_id || null, machine_type_id || null]
  );
  return result.rows[0];
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
  const result = await pool.query(
    'UPDATE projects SET customer_name=$1, customer_location=$2, description=$3, job_no=$4, customer_chain_id=$5, machine_type_id=$6, updated_at=NOW() WHERE id=$7 AND user_id=$8 RETURNING *',
    [customer_name, customer_location, description, job_no || null, customer_chain_id || null, machine_type_id || null, id, userId]
  );
  if (result.rows.length === 0) throw new Error('Project not found');
  return result.rows[0];
};

export const deleteProject = async (id: number, userId: number): Promise<void> => {
  const result = await pool.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [id, userId]);
  if (result.rowCount === 0) throw new Error('Project not found');
};
