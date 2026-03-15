import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as projectService from '../services/projectService';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await projectService.getProjects(req.user!.id);
    res.json(projects);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await projectService.getProjectById(+req.params.id, req.user!.id);
    res.json(project);
  } catch (e: any) { res.status(404).json({ message: e.message }); }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customer_name, customer_location, description, job_no, customer_chain_id, machine_type_id } = req.body;
    const project = await projectService.createProject(
      req.user!.id,
      customer_name,
      customer_location,
      description,
      job_no,
      Number(customer_chain_id) || null,
      Number(machine_type_id) || null
    );
    res.status(201).json(project);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customer_name, customer_location, description, job_no, customer_chain_id, machine_type_id } = req.body;
    const project = await projectService.updateProject(
      +req.params.id,
      req.user!.id,
      customer_name,
      customer_location,
      description,
      job_no,
      Number(customer_chain_id) || null,
      Number(machine_type_id) || null
    );
    res.json(project);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await projectService.deleteProject(+req.params.id, req.user!.id);
    res.json({ message: 'Deleted' });
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};
