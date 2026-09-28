import { useCallback, useState, type FormEvent } from 'react';
import { SelectField, TextAreaField, TextField } from '../../components/admin/FormFields';
import { StateBlock } from '../../components/common/StateBlock';
import { useAsync } from '../../hooks/useAsync';
import {
  createCollection,
  deleteCollection,
  fetchAdminCollections,
  updateCollection,
} from '../../services/adminApi';
import type { CollectionInput } from '../../types/admin';
import { toErrorMessage } from '../../types/api';
import type { Collection } from '../../types/catalog';
import { slugify } from '../../utils/format';
import {
  hasErrors,
  validateCollectionForm,
  type CollectionFormErrors,
} from '../../utils/validation';
import './AdminCollectionsPage.css';

const EMPTY_COLLECTION: CollectionInput = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  is_active: true,
  sort_order: 1,
};

/**
 * `/admin/collections` — inline CRUD for collections, which drive the homepage
 * "Explore Now!" sections and the product form's collection picker.
 */
export function AdminCollectionsPage() {
  const [form, setForm] = useState<CollectionInput>(EMPTY_COLLECTION);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<CollectionFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => fetchAdminCollections(), []);
  const collections = useAsync(load, 'Koleksi tidak dapat dimuat.');
  const reload = collections.reload;

  function patch(changes: Partial<CollectionInput>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  function startEdit(collection: Collection) {
    setEditingId(collection.id);
    setErrors({});
    setForm({
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      image_url: collection.image_url,
      is_active: collection.is_active,
      sort_order: collection.sort_order,
    });
  }

  function resetForm() {
    setEditingId(null);
    setErrors({});
    setForm(EMPTY_COLLECTION);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCollectionForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    setActionError(null);
    try {
      if (editingId !== null) await updateCollection(editingId, form);
      else await createCollection(form);
      resetForm();
      reload();
    } catch (reason: unknown) {
      setActionError(toErrorMessage(reason, 'Gagal menyimpan koleksi.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(collection: Collection) {
    setActionError(null);
    try {
      await deleteCollection(collection.id);
      if (editingId === collection.id) resetForm();
      reload();
    } catch (reason: unknown) {
      setActionError(toErrorMessage(reason, 'Gagal menghapus koleksi.'));
    }
  }

  const list = collections.data ?? [];

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Koleksi</h1>
          <p className="admin-page__subtitle">
            Koleksi menentukan section pada halaman utama dan pilihan pada form produk.
          </p>
        </div>
      </header>

      {actionError && (
        <p className="field__error" role="alert">
          {actionError}
        </p>
      )}

      <div className="admin-collections">
        <section className="card admin-collections__form">
          <h2 className="panel-title">{editingId !== null ? 'Edit koleksi' : 'Koleksi baru'}</h2>

          <form className="admin-collections__fields" onSubmit={handleSubmit} noValidate>
            <TextField
              id="collection-name"
              label="Nama koleksi"
              value={form.name}
              required
              error={errors.name}
              onChange={(value) => patch({ name: value })}
            />

            <TextField
              id="collection-slug"
              label="Slug"
              value={form.slug}
              required
              error={errors.slug}
              onGenerate={() => slugify(form.name)}
              generateLabel="Dari nama"
              onChange={(value) => patch({ slug: value })}
            />

            <TextAreaField
              id="collection-description"
              label="Deskripsi"
              value={form.description}
              rows={3}
              onChange={(value) => patch({ description: value })}
            />

            <TextField
              id="collection-image"
              label="URL gambar"
              value={form.image_url}
              placeholder="https://… atau /uploads/koleksi.jpg"
              onChange={(value) => patch({ image_url: value })}
            />

            <div className="field__row">
              <TextField
                id="collection-order"
                label="Urutan"
                type="number"
                min={0}
                value={String(form.sort_order)}
                error={errors.sort_order}
                onChange={(value) => patch({ sort_order: Number(value) })}
              />

              <SelectField
                id="collection-active"
                label="Status"
                value={form.is_active ? 'true' : 'false'}
                options={[
                  { value: 'true', label: 'Aktif' },
                  { value: 'false', label: 'Nonaktif' },
                ]}
                onChange={(value) => patch({ is_active: value === 'true' })}
              />
            </div>

            <div className="admin-collections__actions">
              {editingId !== null && (
                <button type="button" className="btn btn--ghost" onClick={resetForm}>
                  Batal edit
                </button>
              )}
              <button type="submit" className="btn btn--admin" disabled={submitting}>
                {submitting
                  ? 'Menyimpan…'
                  : editingId !== null
                    ? 'Simpan perubahan'
                    : 'Tambah koleksi'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-collections__list-wrap">
          {collections.loading && <StateBlock variant="loading" title="Memuat koleksi…" compact />}

          {!collections.loading && collections.error && (
            <StateBlock
              variant="error"
              title="Koleksi tidak dapat dimuat"
              message={collections.error}
              onRetry={reload}
              compact
            />
          )}

          {!collections.loading && !collections.error && list.length === 0 && (
            <StateBlock
              variant="empty"
              title="Belum ada koleksi"
              message="Tambahkan koleksi melalui form di samping."
              compact
            />
          )}

          {!collections.loading && !collections.error && list.length > 0 && (
            <ul className="admin-collections__list">
              {list.map((collection) => (
                <li key={collection.id} className="admin-collections__item">
                  <div className="admin-collections__info">
                    <span className="admin-collections__name">{collection.name}</span>
                    <span className="admin-collections__slug">/{collection.slug}</span>
                    <span className="admin-collections__meta">
                      Urutan {collection.sort_order} · {collection.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="admin-collections__item-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => startEdit(collection)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => remove(collection)}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}