export const PRODUCT_STATUSES = ['ready', 'not_ready', 'discontinued'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Color {
  id: number;
  name: string;
  hex_code: string;
  created_at: string;
  updated_at: string;
}

export interface Size {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  color_id: number;
  size_id: number;
  sku: string;
  stock: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  color?: Color | null;
  size?: Size | null;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCollection {
  product_id: number;
  collection_id: number;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  material: string;
  care_instruction: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
  collections: Collection[];
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export const PRODUCT_SORTS = ['newest', 'name_asc', 'price_asc', 'price_desc'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
export interface ProductQuery {
  search?: string;
  category_id?: number | null;
  category_slug?: string | null;
  collection_id?: number | null;
  collection_slug?: string | null;
  status?: ProductStatus | null;
  sort?: ProductSort;
  page?: number;
  per_page?: number;
  include_inactive?: boolean;
}
