import type { Category, Collection, Color, ProductStatus, Size } from './catalog';
/** Admin dashboard counters, derived from products + variant stock. */
export interface ProductStats {
  total: number;
  ready: number;
  not_ready: number;
  discontinued: number;
  /** Products whose total active variant stock is 0. */
  empty: number;
  active_products: number;
  total_stock: number;
}

/** Payload for `POST /api/admin/products` and `PUT /api/admin/products/:id`. */
export interface ProductVariantInput {
  id?: number;
  color_id: number;
  size_id: number;
  sku: string;
  stock: number;
  price: number;
  is_active: boolean;
}

export interface ProductImageInput {
  id?: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductInput {
  name: string;
  slug: string;
  category_id: number;
  description: string;
  price: number;
  material: string;
  care_instruction: string;
  status: ProductStatus;
  images: ProductImageInput[];
  variants: ProductVariantInput[];
  collection_ids: number[];
}

export interface BannerInput {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
}

export interface CollectionInput {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

/** Response of the upload endpoint — the backend stores the binary and returns a URL. */
export interface UploadResponse {
  image_url: string;
}

/** Reference data required by the admin product form. */
export interface AdminReferenceData {
  categories: Category[];
  collections: Collection[];
  colors: Color[];
  sizes: Size[];
}
