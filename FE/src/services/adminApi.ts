import type {
  AdminReferenceData,
  BannerInput,
  CollectionInput,
  ProductInput,
  ProductStats,
  UploadResponse,
} from '../types/admin';
import { ApiError, type Paginated } from '../types/api';
import type { AdminUser, Banner, Collection, Product, ProductQuery } from '../types/catalog';
import { attachVariantRelations } from '../utils/product';
import { fetchCategories, fetchCollections, fetchColors, fetchSizes } from './catalogApi';
import { request, requestPageWithFallback, requestWithFallback, toQueryString } from './http';
import * as seed from './mockDb';

/**
 * Admin endpoints (all behind the auth middleware on the Gin side):
 *
 *   GET    /api/admin/stats
 *   GET    /api/admin/products          GET /api/admin/products/:id
 *   POST   /api/admin/products          PUT /api/admin/products/:id
 *   DELETE /api/admin/products/:id
 *   GET    /api/admin/banners           POST /api/admin/banners
 *   PUT    /api/admin/banners/:id       DELETE /api/admin/banners/:id
 *   GET    /api/admin/collections       POST /api/admin/collections
 *   PUT    /api/admin/collections/:id   DELETE /api/admin/collections/:id
 *   POST   /api/admin/uploads
 *   GET    /api/admin/me                POST /api/admin/login
 */

const ADMIN_PER_PAGE = 10;

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export function fetchProductStats(): Promise<ProductStats> {
  return requestWithFallback<ProductStats>('/admin/stats', undefined, () => seed.productStats());
}

/* ── Reference data ──────────────────────────────────────────────────────── */

export async function fetchAdminReferenceData(): Promise<AdminReferenceData> {
  const [categories, collections, colors, sizes] = await Promise.all([
    fetchCategories(),
    fetchCollections(),
    fetchColors(),
    fetchSizes(),
  ]);

  return { categories, collections, colors, sizes };
}

/* ── Products ────────────────────────────────────────────────────────────── */

export async function fetchAdminProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  const page = query.page ?? 1;
  const perPage = query.per_page ?? ADMIN_PER_PAGE;
  const search = toQueryString({
    search: query.search,
    category_id: query.category_id,
    status: query.status,
    sort: query.sort,
    page,
    per_page: perPage,
  });

  const result = await requestPageWithFallback<Product>(
    `/admin/products${search}`,
    undefined,
    () => seed.listProducts({ ...query, page, per_page: perPage }, 'admin')
  );

  if (result.data.length === 0) return result;
  const { colors, sizes } = await fetchAdminReferenceData();
  return {
    ...result,
    data: result.data.map((product) => attachVariantRelations(product, colors, sizes)),
  };
}

export async function fetchAdminProduct(id: number): Promise<Product> {
  const product = await requestWithFallback<Product | null>(
    `/admin/products/${id}`,
    undefined,
    () => seed.getProductById(id)
  );

  if (!product) throw new ApiError('Produk tidak ditemukan.', 404);

  const { colors, sizes } = await fetchAdminReferenceData();
  return attachVariantRelations(product, colors, sizes);
}

export function createProduct(input: ProductInput): Promise<Product> {
  return requestWithFallback<Product>(
    '/admin/products',
    { method: 'POST', body: JSON.stringify(input) },
    () => seed.createProduct(input)
  );
}

export function updateProduct(id: number, input: ProductInput): Promise<Product> {
  return requestWithFallback<Product>(
    `/admin/products/${id}`,
    { method: 'PUT', body: JSON.stringify(input) },
    () => {
      const updated = seed.updateProduct(id, input);
      if (!updated) throw new ApiError('Produk tidak ditemukan.', 404);
      return updated;
    }
  );
}

export function deleteProduct(id: number): Promise<void> {
  return requestWithFallback<{ message?: string } | null>(
    `/admin/products/${id}`,
    { method: 'DELETE' },
    () => {
      if (!seed.deleteProduct(id)) throw new ApiError('Produk tidak ditemukan.', 404);
      return null;
    }
  ).then(() => undefined);
}

/* ── Banners (Main Board) ────────────────────────────────────────────────── */

export function fetchAdminBanners(): Promise<Banner[]> {
  return requestWithFallback<Banner[]>('/admin/banners', undefined, () => seed.listAllBanners());
}

export function createBanner(input: BannerInput): Promise<Banner> {
  return requestWithFallback<Banner>(
    '/admin/banners',
    { method: 'POST', body: JSON.stringify(input) },
    () => seed.createBanner(input)
  );
}

export function updateBanner(id: number, input: Partial<BannerInput>): Promise<Banner> {
  return requestWithFallback<Banner>(
    `/admin/banners/${id}`,
    { method: 'PUT', body: JSON.stringify(input) },
    () => {
      const updated = seed.updateBanner(id, input);
      if (!updated) throw new ApiError('Banner tidak ditemukan.', 404);
      return updated;
    }
  );
}

export function deleteBanner(id: number): Promise<void> {
  return requestWithFallback<{ message?: string } | null>(
    `/admin/banners/${id}`,
    { method: 'DELETE' },
    () => {
      if (!seed.deleteBanner(id)) throw new ApiError('Banner tidak ditemukan.', 404);
      return null;
    }
  ).then(() => undefined);
}

/* ── Collections ─────────────────────────────────────────────────────────── */

export function fetchAdminCollections(): Promise<Collection[]> {
  return requestWithFallback<Collection[]>('/admin/collections', undefined, () =>
    seed.listCollections(true)
  );
}

export function createCollection(input: CollectionInput): Promise<Collection> {
  return requestWithFallback<Collection>(
    '/admin/collections',
    { method: 'POST', body: JSON.stringify(input) },
    () => seed.createCollection(input)
  );
}

export function updateCollection(id: number, input: CollectionInput): Promise<Collection> {
  return requestWithFallback<Collection>(
    `/admin/collections/${id}`,
    { method: 'PUT', body: JSON.stringify(input) },
    () => {
      const updated = seed.updateCollection(id, input);
      if (!updated) throw new ApiError('Koleksi tidak ditemukan.', 404);
      return updated;
    }
  );
}

export function deleteCollection(id: number): Promise<void> {
  return requestWithFallback<{ message?: string } | null>(
    `/admin/collections/${id}`,
    { method: 'DELETE' },
    () => {
      if (!seed.deleteCollection(id)) throw new ApiError('Koleksi tidak ditemukan.', 404);
      return null;
    }
  ).then(() => undefined);
}

/* ── Image upload ────────────────────────────────────────────────────────── */

/**
 * Upload abstraction for product/banner images. The backend stores the binary and
 * returns `{ "image_url": "https://..." }`; the URL (never the binary) is what the
 * forms keep in state. Until the endpoint exists, a local object URL is returned so
 * the picker can still preview the selected file.
 */
/* ── Image upload ───────────────────────────────────────────────────── */
export async function uploadImage(
  file: File
): Promise<UploadResponse> {
  const body = new FormData();
  body.append('file', file);

  return request<UploadResponse>(
    '/admin/media',
    {
      method: 'POST',
      body,
    }
  );
}

/* ── Session ─────────────────────────────────────────────────────────────── */

export interface AdminSession {
  admin: AdminUser;
  token: string | null;
}

/**
 * Demo session: the real deployment gets `{ admin, token }` from the login handler;
 * `http.ts` then sends the token as a Bearer header on every admin request.
 */
export function signInAdmin(email: string, password: string): Promise<AdminSession> {
  return requestWithFallback<AdminSession>(
    '/admin/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    () => {
      if (!email.trim() || !password.trim()) {
        throw new ApiError('Email dan password wajib diisi.', 401);
      }
      const admin = seed.getAdminUser();
      return { admin: { ...admin, email: email.trim() }, token: 'demo-token' };
    }
  );
}

export function fetchCurrentAdmin(): Promise<AdminUser> {
  return requestWithFallback<AdminUser>('/admin/me', undefined, () => seed.getAdminUser());
}

export function signOutAdmin(): Promise<void> {
  return requestWithFallback<{ message?: string } | null>(
    '/admin/logout',
    { method: 'POST' },
    () => null
  ).then(() => undefined);
}


