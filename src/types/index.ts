export interface User {
  id: number;
  name: string;
  surname?: string;
  email: string;
  password: string;
  role: string;
  is_approved: boolean;
  phone?: string;
  company?: string;
  position?: string;
  profile_photo?: string;
  created_at: Date;
}

export interface Project {
  id: number;
  user_id: number;
  customer_name: string;
  customer_location: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  product_count?: number;
}

export interface Product {
  id: number;
  project_id: number;
  product_name: string;
  capacity?: string;
  mix_type?: string;
  no_of_flavor?: number;
  weight_gr?: number;
  volume_ml?: number;
  has_inclusion: boolean;
  inclusion_type?: string;
  inclusion_size_mm?: number;
  filling_pattern?: string;
  has_ripple_sauce: boolean;
  ripple_sauce_info?: string;
  l1?: number; l2?: number; width?: number; thickness?: number; diameter?: number;
  biscuit_l?: number; biscuit_w?: number; biscuit_thick?: number; biscuit_diam?: number;
  stick_type?: string; stick_length?: number; stick_width?: number; stick_thickness?: number;
  dipping_style?: string; dipping_note?: string;
  has_choc_tank_ingredients: boolean;
  choc_ingredient_type?: string; choc_ingredient_size?: number;
  has_lid: boolean;
  lid1_type?: string; lid1_is_stackable: boolean;
  lid2_type?: string; lid2_is_stackable: boolean;
  has_pencil_filler: boolean; pencil_filler_note?: string;
  has_choc_disc: boolean;
  has_liquid_sauce_topping: boolean; liquid_sauce_info?: string;
  has_dry_topping: boolean; dry_topping_info?: string;
  has_wrapper: boolean; wrapper_info?: string;
  is_eol_included: boolean;
  created_at: Date;
  updated_at: Date;
  images?: ProductImage[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  created_at: Date;
}

export interface AuthRequest extends Express.Request {
  user?: { id: number; email: string };
}
