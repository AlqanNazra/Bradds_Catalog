import { useMemo, useState, type FormEvent } from 'react';
import type { AdminReferenceData, ProductInput } from '../../types/admin';
import type { Product, ProductStatus } from '../../types/catalog';
import { slugify } from '../../utils/format';
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_OPTIONS } from '../../utils/product';
import { hasErrors, validateProductForm, type ProductFormErrors } from '../../utils/validation';
import { ImageUploader } from './ImageUploader';
import { SelectField, TextAreaField, TextField } from './FormFields';
import { VariantEditor } from './VariantEditor';
import './ProductForm.css';

interface ProductFormProps {
  /** `null` = create mode. */
  product: Product | null;
  reference: AdminReferenceData;
  onSubmit: (input: ProductInput) => Promise<void>;
  submitting: boolean;
  submitError: string | null;
  onCancel: () => void;
}

function toFormState(product: Product | null): ProductInput {
  if (!product) {
    return {
      name: '',
      slug: '',
      category_id: 0,
      description: '',
      price: 0,
      material: '',
      care_instruction: '',
      status: 'not_ready',
      images: [],
      variants: [],
      collection_ids: [],
    };
  }

  return {
    name: product.name,
    slug: product.slug,
    category_id: product.category_id,
    description: product.description,
    price: product.price,
    material: product.material,
    care_instruction: product.care_instruction,
    status: product.status,
    images: product.images.map((image) => ({
      id: image.id,
      image_url: image.image_url,
      alt_text: image.alt_text,
      sort_order: image.sort_order,
      is_primary: image.is_primary,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      color_id: variant.color_id,
      size_id: variant.size_id,
      sku: variant.sku,
      stock: variant.stock,
      price: variant.price,
      is_active: variant.is_active,
    })),
    collection_ids: product.collections.map((collection) => collection.id),
  };
}

/**
 * Shared create/edit form for `/admin/products/new` and `/admin/products/:id/edit`.
 * Submits the full aggregate (product + images + variants + collections), matching the
 * `ProductInput` payload the API expects.
 */
export function ProductForm({
  product,
  reference,
  onSubmit,
  submitting,
  submitError,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductInput>(() => toFormState(product));
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const categoryOptions = useMemo(
    () => [
      { value: 0, label: 'Pilih kategori' },
      ...reference.categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [reference.categories]
  );

  function patch(changes: Partial<ProductInput>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  function toggleCollection(collectionId: number) {
    patch({
      collection_ids: form.collection_ids.includes(collectionId)
        ? form.collection_ids.filter((id) => id !== collectionId)
        : [...form.collection_ids, collectionId],
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateProductForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    await onSubmit(form);
  }

  return (
    <form className="product-form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <p className="product-form__submit-error" role="alert">
          {submitError}
        </p>
      )}

      <section className="card product-form__section">
        <h2 className="panel-title">Informasi produk</h2>

        <div className="field__row">
          <TextField
            id="product-name"
            label="Nama produk"
            value={form.name}
            required
            error={errors.name}
            placeholder="Contoh: Kaos Basic Combed 30s"
            onChange={(value) => patch({ name: value })}
          />

          <TextField
            id="product-slug"
            label="Slug"
            value={form.slug}
            required
            error={errors.slug}
            hint="Dipakai pada URL: /products/<slug>"
            onGenerate={() => slugify(form.name)}
            generateLabel="Dari nama"
            onChange={(value) => patch({ slug: value })}
          />
        </div>

        <div className="field__row">
          <SelectField
            id="product-category"
            label="Kategori"
            value={form.category_id}
            required
            error={errors.category_id}
            options={categoryOptions}
            onChange={(value) => patch({ category_id: Number(value) })}
          />

          <TextField
            id="product-price"
            label="Harga produk (Rp)"
            type="number"
            min={0}
            value={String(form.price)}
            required
            error={errors.price}
            hint="Harga varian 0 akan mengikuti harga ini."
            onChange={(value) => patch({ price: Number(value) })}
          />

          <SelectField
            id="product-status"
            label="Status"
            value={form.status}
            options={PRODUCT_STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            hint="Empty dihitung otomatis dari total stok varian."
            onChange={(value) => patch({ status: value as ProductStatus })}
          />
        </div>

        <TextAreaField
          id="product-description"
          label="Deskripsi"
          value={form.description}
          required
          error={errors.description}
          rows={5}
          onChange={(value) => patch({ description: value })}
        />

        <div className="field__row">
          <TextAreaField
            id="product-material"
            label="Material"
            value={form.material}
            required
            error={errors.material}
            rows={3}
            onChange={(value) => patch({ material: value })}
          />

          <TextAreaField
            id="product-care"
            label="Care instruction"
            value={form.care_instruction}
            rows={3}
            hint={`Status saat ini: ${PRODUCT_STATUS_LABELS[form.status]}`}
            onChange={(value) => patch({ care_instruction: value })}
          />
        </div>
      </section>

      <section className="card product-form__section">
        <h2 className="panel-title">Gambar produk</h2>
        <ImageUploader
          images={form.images}
          error={errors.images}
          onChange={(images) => patch({ images })}
        />
      </section>

      <section className="card product-form__section">
        <h2 className="panel-title">Varian (warna × ukuran)</h2>
        <VariantEditor
          variants={form.variants}
          colors={reference.colors}
          sizes={reference.sizes}
          errors={errors.variantErrors}
          listError={errors.variants}
          onChange={(variants) => patch({ variants })}
        />
      </section>

      <section className="card product-form__section">
        <h2 className="panel-title">Koleksi</h2>
        {reference.collections.length === 0 ? (
          <p className="field__hint">Belum ada koleksi. Tambahkan koleksi terlebih dahulu.</p>
        ) : (
          <ul className="product-form__collections">
            {reference.collections.map((collection) => (
              <li key={collection.id}>
                <label className="product-form__checkbox">
                  <input
                    type="checkbox"
                    checked={form.collection_ids.includes(collection.id)}
                    onChange={() => toggleCollection(collection.id)}
                  />
                  <span>{collection.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="product-form__actions">
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={submitting}>
          Batal
        </button>
        <button type="submit" className="btn btn--admin" disabled={submitting}>
          {submitting ? 'Menyimpan…' : product ? 'Simpan perubahan' : 'Simpan produk'}
        </button>
      </div>
    </form>
  );
}