import type {
  Color,
  Product,
  ProductMedia,
  ProductSort,
  ProductStatus,
  ProductVariant,
  Size,
} from '../types/catalog';
import { PRODUCT_SORTS } from '../types/catalog';

export { PRODUCT_SORTS };

/* ── Status presentation ───────────────────────────────────────────────────── */

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ready: 'Ready',
  not_ready: 'Belum Siap',
  discontinued: 'Tidak Dilanjut',
};

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = (
  Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]
).map((value) => ({ value, label: PRODUCT_STATUS_LABELS[value] }));

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export const PRODUCT_SORT_LABELS: Record<ProductSort, string> = {
  newest: 'Terbaru',
  name_asc: 'Nama A-Z',
  price_asc: 'Harga terendah',
  price_desc: 'Harga tertinggi',
};

/** Safely reads a `sort` value coming from the URL query string. */
export function parseProductSort(value: string | null | undefined): ProductSort {
  return PRODUCT_SORTS.includes(value as ProductSort) ? (value as ProductSort) : 'newest';
}

export function productStatusTone(status: ProductStatus): StatusTone {
  switch (status) {
    case 'ready':
      return 'success';
    case 'not_ready':
      return 'warning';
    case 'discontinued':
      return 'danger';
    default:
      return 'neutral';
  }
}

/**
 * Dashboard buckets. `empty` is derived (no active variant stock) instead of being a
 * stored status, so it never goes out of sync with `ProductVariant.stock`.
 */
export type ProductBucket = ProductStatus | 'empty';

export const PRODUCT_BUCKET_LABELS: Record<ProductBucket, string> = {
  ready: 'Ready',
  not_ready: 'Belum Siap',
  discontinued: 'Tidak Dilanjut',
  empty: 'Empty',
};

export function productBucket(product: Product): ProductBucket {
  if (product.status === 'discontinued') return 'discontinued';
  if (product.status === 'not_ready') return 'not_ready';
  return totalStock(product) > 0 ? 'ready' : 'empty';
}

export function bucketTone(bucket: ProductBucket): StatusTone {
  switch (bucket) {
    case 'ready':
      return 'success';
    case 'not_ready':
      return 'warning';
    case 'discontinued':
      return 'danger';
    default:
      return 'neutral';
  }
}

/* ── Variant / stock helpers ───────────────────────────────────────────────── */

export function activeVariants(product: Product): ProductVariant[] {
  return product.variants.filter((variant) => variant.is_active);
}

/** `totalStock = sum(all active variant stocks)` — computed, never stored. */
export function totalStock(product: Product): number {
  return activeVariants(product).reduce((sum, variant) => sum + (variant.stock ?? 0), 0);
}

/**
 * Resolves the preloaded Color/Size relations. The API normally embeds them; when a
 * handler returns foreign keys only, the client joins them against `/api/colors` and
 * `/api/sizes` so the UI can render hex swatches and ordered size options.
 */
export function attachVariantRelations(
  product: Product,
  colors: Color[],
  sizes: Size[]
): Product {
  const variants = product.variants.map((variant) => ({
    ...variant,
    color: variant.color ?? colors.find((color) => color.id === variant.color_id) ?? null,
    size: variant.size ?? sizes.find((size) => size.id === variant.size_id) ?? null,
  }));
  return { ...product, variants };
}

export function availableColors(product: Product): Color[] {
  const seen = new Map<number, Color>();
  for (const variant of activeVariants(product)) {
    if (variant.color && !seen.has(variant.color.id)) {
      seen.set(variant.color.id, variant.color);
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Sizes ordered by `Size.sort_order`. */
export function availableSizes(product: Product): Size[] {
  const seen = new Map<number, Size>();
  for (const variant of activeVariants(product)) {
    if (variant.size && !seen.has(variant.size.id)) {
      seen.set(variant.size.id, variant.size);
    }
  }
  return [...seen.values()].sort((a, b) => a.sort_order - b.sort_order);
}

export function findVariant(
  product: Product,
  colorId: number | null,
  sizeId: number | null
): ProductVariant | undefined {
  if (colorId === null || sizeId === null) return undefined;
  return product.variants.find(
    (variant) => variant.color_id === colorId && variant.size_id === sizeId
  );
}

/** True when the size has an active, in-stock variant for the given color. */
export function isSizeAvailable(product: Product, colorId: number | null, sizeId: number): boolean {
  const variant = findVariant(product, colorId, sizeId);
  return Boolean(variant && variant.is_active && variant.stock > 0);
}

export interface VariantAvailability {
  color: Color | null;
  size: Size | null;
  variant: ProductVariant | null;
  inStock: boolean;
  message: string;
}

/**
 * Default colour/size for a product: the first combination that is actually in stock,
 * falling back to the first option of each dimension. Kept as a pure helper so the
 * product detail page can derive its initial selection during render.
 */
export function defaultSelection(product: Product): {
  colorId: number | null;
  sizeId: number | null;
} {
  const colors = availableColors(product);
  const sizes = availableSizes(product);

  const color =
    colors.find((item) => sizes.some((size) => isSizeAvailable(product, item.id, size.id))) ??
    colors[0] ??
    null;
  const size =
    sizes.find((item) => isSizeAvailable(product, color?.id ?? null, item.id)) ?? sizes[0] ?? null;

  return { colorId: color?.id ?? null, sizeId: size?.id ?? null };
}

/** Human readable state for the current selector combination. */
export function describeSelection(
  product: Product,
  colorId: number | null,
  sizeId: number | null
): VariantAvailability {
  const color = availableColors(product).find((item) => item.id === colorId) ?? null;
  const size = availableSizes(product).find((item) => item.id === sizeId) ?? null;

  if (colorId === null || sizeId === null) {
    return { color, size, variant: null, inStock: false, message: 'Pilih warna dan ukuran.' };
  }

  const variant = findVariant(product, colorId, sizeId) ?? null;
  if (!variant) {
    return {
      color,
      size,
      variant: null,
      inStock: false,
      message: 'Kombinasi warna dan ukuran ini belum tersedia.',
    };
  }
  if (!variant.is_active) {
    return { color, size, variant, inStock: false, message: 'Varian ini sedang tidak aktif.' };
  }
  if (variant.stock <= 0) {
    return { color, size, variant, inStock: false, message: 'Stok varian ini sedang habis.' };
  }
  return { color, size, variant, inStock: true, message: `Stok tersedia: ${variant.stock}` };
}

/* ── Images ────────────────────────────────────────────────────────────────── */

export function sortedImages(product: Product): ProductMedia[] {
  return [...product.media].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

export function primaryImage(product: Product): ProductMedia | null {
  return sortedImages(product)[0] ?? null;
}

/* ── Pricing ───────────────────────────────────────────────────────────────── */

/** Variant prices may override the product price, so show the real range. */
export function priceRange(product: Product): { min: number; max: number } {
  const prices = activeVariants(product)
    .map((variant) => variant.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  if (prices.length === 0) {
    return { min: product.price, max: product.price };
  }
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
