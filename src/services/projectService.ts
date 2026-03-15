import pool from '../config/database';
import { Project } from '../types';

export const getProjects = async (userId: number): Promise<Project[]> => {
  const result = await pool.query(
    `SELECT p.*, COUNT(pr.id)::int AS product_count
     FROM projects p
     LEFT JOIN products pr ON pr.project_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getProjectById = async (id: number, userId: number): Promise<Project> => {
  const result = await pool.query('SELECT * FROM projects WHERE id=$1 AND user_id=$2', [id, userId]);
  if (result.rows.length === 0) throw new Error('Project not found');
  return result.rows[0];
};

export const createProject = async (userId: number, customer_name: string, customer_location: string, description: string): Promise<Project> => {
  const result = await pool.query(
    'INSERT INTO projects (user_id, customer_name, customer_location, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, customer_name, customer_location, description]
  );
  return result.rows[0];
};

export const updateProject = async (id: number, userId: number, customer_name: string, customer_location: string, description: string): Promise<Project> => {
  const result = await pool.query(
    'UPDATE projects SET customer_name=$1, customer_location=$2, description=$3, updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING *',
    [customer_name, customer_location, description, id, userId]
  );
  if (result.rows.length === 0) throw new Error('Project not found');
  return result.rows[0];
};

export const deleteProject = async (id: number, userId: number): Promise<void> => {
  const result = await pool.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [id, userId]);
  if (result.rowCount === 0) throw new Error('Project not found');
};
