import { Request, Response } from 'express';
import * as productService from '../services/productService';

const parseBool = (v: any) => v === 'true' || v === true;
const parseNum = (v: any) => (v !== undefined && v !== '' && v !== null) ? Number(v) : undefined;

const extractData = (b: any) => ({
  product_name: b.product_name,
  capacity: b.capacity || undefined,
  mix_type: b.mix_type || undefined,
  no_of_flavor: parseNum(b.no_of_flavor),
  weight_gr: parseNum(b.weight_gr),
  volume_ml: parseNum(b.volume_ml),
  has_inclusion: parseBool(b.has_inclusion),
  inclusion_type: b.inclusion_type || undefined,
  inclusion_size_mm: parseNum(b.inclusion_size_mm),
  filling_pattern: b.filling_pattern || undefined,
  has_ripple_sauce: parseBool(b.has_ripple_sauce),
  ripple_sauce_info: b.ripple_sauce_info || undefined,
  l1: parseNum(b.l1), l2: parseNum(b.l2), width: parseNum(b.width),
  thickness: parseNum(b.thickness), diameter: parseNum(b.diameter),
  biscuit_l: parseNum(b.biscuit_l), biscuit_w: parseNum(b.biscuit_w),
  biscuit_thick: parseNum(b.biscuit_thick), biscuit_diam: parseNum(b.biscuit_diam),
  stick_type: b.stick_type || undefined,
  stick_length: parseNum(b.stick_length), stick_width: parseNum(b.stick_width), stick_thickness: parseNum(b.stick_thickness),
  dipping_style: b.dipping_style || undefined,
  dipping_note: b.dipping_note || undefined,
  has_choc_tank_ingredients: parseBool(b.has_choc_tank_ingredients),
  choc_ingredient_type: b.choc_ingredient_type || undefined,
  choc_ingredient_size: parseNum(b.choc_ingredient_size),
  has_lid: parseBool(b.has_lid),
  lid1_type: b.lid1_type || undefined,
  lid1_is_stackable: parseBool(b.lid1_is_stackable),
  lid2_type: b.lid2_type || undefined,
  lid2_is_stackable: parseBool(b.lid2_is_stackable),
  has_pencil_filler: parseBool(b.has_pencil_filler),
  pencil_filler_note: b.pencil_filler_note || undefined,
  has_choc_disc: parseBool(b.has_choc_disc),
  has_liquid_sauce_topping: parseBool(b.has_liquid_sauce_topping),
  liquid_sauce_info: b.liquid_sauce_info || undefined,
  has_dry_topping: parseBool(b.has_dry_topping),
  dry_topping_info: b.dry_topping_info || undefined,
  has_wrapper: parseBool(b.has_wrapper),
  wrapper_info: b.wrapper_info || undefined,
  is_eol_included: parseBool(b.is_eol_included),
});

export const getByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await productService.getProductsByProject(+req.params.projectId);
    res.json(products);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const searchAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, capacity } = req.query as { name?: string; capacity?: string };
    const products = await productService.getAllProducts(name, capacity);
    res.json(products);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const imagePaths = files ? files.map(f => `/uploads/${f.filename}`) : [];
    const product = await productService.createProduct(+req.body.project_id, extractData(req.body), imagePaths);
    res.status(201).json(product);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.updateProduct(+req.params.id, extractData(req.body));
    res.json(product);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};

export const copy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { project_id } = req.body;
    if (!project_id) { res.status(400).json({ message: 'project_id zorunlu' }); return; }
    const product = await productService.copyProduct(+req.params.id, +project_id);
    res.status(201).json(product);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};

export const usage = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await productService.getProductUsage(+req.params.id);
    res.json(data);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await productService.deleteProduct(+req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};

export const removeImage = async (req: Request, res: Response): Promise<void> => {
  try {
    await productService.deleteProductImage(+req.params.imageId);
    res.json({ message: 'Image deleted' });
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};

export const addImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ message: 'No images provided' }); return; }
    const imagePaths = files.map(f => `/uploads/${f.filename}`);
    const images = await productService.addProductImages(+req.params.id, imagePaths);
    res.status(201).json(images);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
};
