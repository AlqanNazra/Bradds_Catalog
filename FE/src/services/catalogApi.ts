import { ApiError, emptyPage, type Paginated } from '../types/api';
import type {
  Banner,
  Category,
  Collection,
  Color,
  Product,
  ProductQuery,
  Size,
} from '../types/catalog';
import { attachVariantRelations } from '../utils/product';
import { requestPageWithFallback, requestWithFallback, toQueryString } from './http';
import * as seed from './mockDb';

/**
 * Public catalog endpoints. Every call hits the real Gin route first and falls back
 * to the local seed data while the endpoint is missing (see `http.ts`).
 *
 *   GET /api/banners
 *   GET /api/categories                GET /api/categories/:slug
 *   GET /api/collections               GET /api/collections/:slug
 *   GET /api/products                  GET /api/products/:slug
 *   GET /api/colors                    GET /api/sizes
 */

const DEFAULT_PER_PAGE = 12;

/* ── Reference tables (cached, used to hydrate variant relations) ─────────── */

let referenceTables: Promise<{ colors: Color[]; sizes: Size[] }> | null = null;

function loadReferenceTables(): Promise<{ colors: Color[]; sizes: Size[] }> {
  if (!referenceTables) {
    referenceTables = Promise.all([
      requestWithFallback<Color[]>('/colors', undefined, () => seed.listColors()),
      requestWithFallback<Size[]>('/sizes', undefined, () => seed.listSizes()),
    ]).then(([colors, sizes]) => ({ colors, sizes }));
  }
  return referenceTables;
}

async function hydrate(product: Product): Promise<Product> {
  const { colors, sizes } = await loadReferenceTables();
  return attachVariantRelations(product, colors, sizes);
}

async function hydratePage(page: Paginated<Product>): Promise<Paginated<Product>> {
  if (page.data.length === 0) return page;
  const { colors, sizes } = await loadReferenceTables();
  return {
    ...page,
    data: page.data.map((product) => attachVariantRelations(product, colors, sizes)),
  };
}

/* ── Banners (Main Board) ────────────────────────────────────────────────── */

export function fetchBanners(): Promise<Banner[]> {
  return requestWithFallback<Banner[]>('/banners', undefined, () => seed.listActiveBanners());
}

/* ── Categories ──────────────────────────────────────────────────────────── */

export function fetchCategories(): Promise<Category[]> {
  return requestWithFallback<Category[]>('/categories', undefined, () => seed.listCategories());
}

export function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  return requestWithFallback<Category | null>(`/categories/${slug}`, undefined, () =>
    seed.getCategoryBySlug(slug)
  );
}

/* ── Collections ─────────────────────────────────────────────────────────── */

export function fetchCollections(): Promise<Collection[]> {
  return requestWithFallback<Collection[]>('/collections', undefined, () => seed.listCollections());
}

export function fetchCollectionBySlug(slug: string): Promise<Collection | null> {
  return requestWithFallback<Collection | null>(`/collections/${slug}`, undefined, () =>
    seed.getCollectionBySlug(slug)
  );
}

/* ── Colors / Sizes ──────────────────────────────────────────────────────── */

export function fetchColors(): Promise<Color[]> {
  return requestWithFallback<Color[]>('/colors', undefined, () => seed.listColors());
}

export function fetchSizes(): Promise<Size[]> {
  return requestWithFallback<Size[]>('/sizes', undefined, () => seed.listSizes());
}

/* ── Products ────────────────────────────────────────────────────────────── */

export async function fetchProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  const page = query.page ?? 1;
  const perPage = query.per_page ?? DEFAULT_PER_PAGE;
  const search = toQueryString({
    search: query.search,
    category_id: query.category_id,
    category_slug: query.category_slug,
    collection_id: query.collection_id,
    collection_slug: query.collection_slug,
    status: query.status,
    sort: query.sort,
    page,
    per_page: perPage,
  });

  const result = await requestPageWithFallback<Product>(
    `/products${search}`,
    undefined,
    () => seed.listProducts({ ...query, page, per_page: perPage }, 'public')
  );

  return hydratePage(result);
}

/** Convenience wrapper for the collection sections on the homepage. */
export function fetchCollectionProducts(slug: string, perPage = 4): Promise<Paginated<Product>> {
  return fetchProducts({ collection_slug: slug, per_page: perPage });
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const product = await requestWithFallback<Product | null>(
    `/products/${slug}`,
    undefined,
    () => seed.getProductBySlug(slug)
  );

  if (!product) {
    throw new ApiError('Produk tidak ditemukan.', 404);
  }
  return hydrate(product);
}

export function emptyProductPage(perPage = DEFAULT_PER_PAGE): Paginated<Product> {
  return emptyPage<Product>(perPage);
}
