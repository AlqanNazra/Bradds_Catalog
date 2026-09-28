import type {
  BannerInput,
  CollectionInput,
  ProductInput,
  ProductVariantInput,
} from '../types/admin';

/**
 * Lightweight, dependency-free validation for the admin forms. Rules follow the
 * domain constraints (stock >= 0, positive prices, unique SKU + color/size combos).
 * Swap for a schema library only if the project adopts one.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Backend contract: the Description field is required on create/update. */
const DESCRIPTION_REQUIRED = true;

export interface VariantFormErrors {
  color_id?: string;
  size_id?: string;
  sku?: string;
  stock?: string;
  price?: string;
}

export interface ProductFormErrors {
  name?: string;
  slug?: string;
  category_id?: string;
  price?: string;
  description?: string;
  material?: string;
  care_instruction?: string;
  images?: string;
  variants?: string;
  variantErrors?: (VariantFormErrors | null)[];
}

export interface BannerFormErrors {
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  sort_order?: string;
  end_at?: string;
}

export interface CollectionFormErrors {
  name?: string;
  slug?: string;
  image_url?: string;
  sort_order?: string;
}

function hasValue(value: unknown): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === 'object') return Object.values(value).some(hasValue);
  return true;
}

export function hasErrors(errors: object): boolean {
  return hasValue(errors);
}

export function isUrlOrPath(value: string): boolean {
  return value.startsWith('/') || /^https?:\/\//i.test(value);
}

export function validateVariant(variant: ProductVariantInput): VariantFormErrors | null {
  const errors: VariantFormErrors = {};
  if (!variant.color_id) errors.color_id = 'Warna wajib dipilih.';
  if (!variant.size_id) errors.size_id = 'Ukuran wajib dipilih.';
  if (!variant.sku.trim()) {
    errors.sku = 'SKU wajib diisi.';
  } else if (/\s/.test(variant.sku.trim())) {
    errors.sku = 'SKU tidak boleh mengandung spasi.';
  }
  if (!Number.isInteger(variant.stock) || variant.stock < 0) {
    errors.stock = 'Stok harus berupa angka 0 atau lebih.';
  }
  if (!Number.isFinite(variant.price) || variant.price < 0) {
    errors.price = 'Harga varian harus berupa angka 0 atau lebih.';
  }
  return Object.keys(errors).length > 0 ? errors : null;
}


export function validateProductForm(input: ProductInput): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!input.name.trim()) {
    errors.name = 'Nama produk wajib diisi.';
  } else if (input.name.trim().length < 3) {
    errors.name = 'Nama produk minimal 3 karakter.';
  }

  if (!input.slug.trim()) {
    errors.slug = 'Slug wajib diisi.';
  } else if (!SLUG_PATTERN.test(input.slug.trim())) {
    errors.slug = 'Gunakan huruf kecil, angka, dan tanda hubung (contoh: kaos-assassins).';
  }

  if (!input.category_id) errors.category_id = 'Kategori wajib dipilih.';

  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = 'Harga harus lebih besar dari 0.';
  }

  if (DESCRIPTION_REQUIRED && !input.description.trim()) {
    errors.description = 'Deskripsi wajib diisi.';
  }

  if (!input.material.trim()) errors.material = 'Material wajib diisi.';

  if (input.images.length === 0) {
    errors.images = 'Tambahkan minimal satu gambar produk.';
  }

  const variantErrors: (VariantFormErrors | null)[] = [];
  const seenCombos = new Map<string, number>();
  const seenSkus = new Map<string, number>();

  input.variants.forEach((variant, index) => {
    let variantError = validateVariant(variant);

    const combo = `${variant.color_id}-${variant.size_id}`;
    const comboOwner =
      variant.color_id && variant.size_id ? seenCombos.get(combo) : undefined;
    if (comboOwner !== undefined) {
      variantError = variantError ?? {};
      variantError.color_id = `Kombinasi warna/ukuran sama dengan varian #${comboOwner + 1}.`;
    } else if (variant.color_id && variant.size_id) {
      seenCombos.set(combo, index);
    }

    const sku = variant.sku.trim().toLowerCase();
    const skuOwner = sku ? seenSkus.get(sku) : undefined;
    if (skuOwner !== undefined) {
      variantError = variantError ?? {};
      variantError.sku = `SKU sudah dipakai varian #${skuOwner + 1}.`;
    } else if (sku) {
      seenSkus.set(sku, index);
    }

    variantErrors.push(variantError);
  });

  if (input.variants.length === 0) {
    errors.variants = 'Tambahkan minimal satu varian.';
  } else if (variantErrors.some(Boolean)) {
    errors.variantErrors = variantErrors;
  }

  return errors;
}

export function validateBannerForm(
  input: BannerInput,
  options: { isNew: boolean }
): BannerFormErrors {
  const errors: BannerFormErrors = {};

  if (!input.title.trim()) errors.title = 'Judul headline wajib diisi.';

  if (options.isNew && !input.image_url.trim()) {
    errors.image_url = 'Gambar banner wajib diunggah.';
  }

  if (!Number.isInteger(input.sort_order) || input.sort_order < 0) {
    errors.sort_order = 'Urutan harus berupa angka 0 atau lebih.';
  }

  if (input.link_url.trim() && !isUrlOrPath(input.link_url.trim())) {
    errors.link_url = 'Link harus berupa URL (https://…) atau path internal (/products).';
  }

  if (input.start_at && input.end_at) {
    const start = new Date(input.start_at).getTime();
    const end = new Date(input.end_at).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
      errors.end_at = 'Tanggal selesai harus setelah tanggal mulai.';
    }
  }

  return errors;
}

export function validateCollectionForm(input: CollectionInput): CollectionFormErrors {
  const errors: CollectionFormErrors = {};

  if (!input.name.trim()) errors.name = 'Nama koleksi wajib diisi.';

  if (!input.slug.trim()) {
    errors.slug = 'Slug wajib diisi.';
  } else if (!SLUG_PATTERN.test(input.slug.trim())) {
    errors.slug = 'Gunakan huruf kecil, angka, dan tanda hubung.';
  }

  if (!Number.isInteger(input.sort_order) || input.sort_order < 0) {
    errors.sort_order = 'Urutan harus berupa angka 0 atau lebih.';
  }

  return errors;
}
