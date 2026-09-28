import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SelectField, TextAreaField, TextField } from '../../components/admin/FormFields';
import { StateBlock } from '../../components/common/StateBlock';
import { useAsync } from '../../hooks/useAsync';
import { createBanner, fetchAdminBanners, updateBanner } from '../../services/adminApi';
import type { BannerInput } from '../../types/admin';
import { toErrorMessage } from '../../types/api';
import type { Banner } from '../../types/catalog';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../../utils/format';
import { hasErrors, validateBannerForm, type BannerFormErrors } from '../../utils/validation';
import './AdminBannerFormPage.css';

const EMPTY_BANNER: BannerInput = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  sort_order: 1,
  is_active: true,
  start_at: null,
  end_at: null,
};

/**
 * `/admin/banners/new` and `/admin/banners/:id/edit` — create or edit one hero banner
 * (the "Main Board" entries).
 */
export function AdminBannerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bannerId = id ? Number.parseInt(id, 10) : null;
  const isEdit = bannerId !== null && Number.isFinite(bannerId);

  const [form, setForm] = useState<BannerInput>(EMPTY_BANNER);
  const [errors, setErrors] = useState<BannerFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<Banner | null> => {
    if (!isEdit || bannerId === null) return null;
    const banners = await fetchAdminBanners();
    const found = banners.find((banner) => banner.id === bannerId) ?? null;
    if (!found) return null;
    setForm({
      title: found.title,
      description: found.description,
      image_url: found.image_url,
      link_url: found.link_url,
      sort_order: found.sort_order,
      is_active: found.is_active,
      start_at: found.start_at,
      end_at: found.end_at,
    });
    return found;
  }, [isEdit, bannerId]);

  const { loading, error, data, reload } = useAsync(load, 'Banner tidak dapat dimuat.');

  function patch(changes: Partial<BannerInput>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateBannerForm(form, { isNew: !isEdit });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isEdit && bannerId !== null) await updateBanner(bannerId, form);
      else await createBanner(form);
      navigate('/admin/banners');
    } catch (reason: unknown) {
      setSubmitError(toErrorMessage(reason, 'Gagal menyimpan banner.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <StateBlock variant="loading" title="Memuat banner…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <StateBlock
          variant="error"
          title="Banner tidak dapat dimuat"
          message={error}
          onRetry={reload}
        />
      </div>
    );
  }

  if (isEdit && !data) {
    return (
      <div className="admin-page">
        <StateBlock
          variant="empty"
          title="Banner tidak ditemukan"
          message={`Tidak ada banner dengan ID ${bannerId}.`}
        />
        <Link to="/admin/banners" className="btn btn--outline">
          Kembali ke Edit Main Board
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-form-head">
          <Link to="/admin/banners" className="admin-form-head__back">
            ← Edit Main Board
          </Link>
          <h1 className="admin-page__title">{isEdit ? 'Edit Banner' : 'Tambah Banner'}</h1>
        </div>
      </header>

      <form className="card banner-form" onSubmit={handleSubmit} noValidate>
        {submitError && (
          <p className="product-form__submit-error" role="alert">
            {submitError}
          </p>
        )}

        <TextField
          id="banner-title"
          label="Judul headline"
          value={form.title}
          required
          error={errors.title}
          placeholder="Contoh: Assassins: Ambaditore"
          onChange={(value) => patch({ title: value })}
        />

        <TextAreaField
          id="banner-description"
          label="Deskripsi"
          value={form.description}
          rows={3}
          onChange={(value) => patch({ description: value })}
        />

        <TextField
          id="banner-image"
          label="URL gambar"
          value={form.image_url}
          required
          error={errors.image_url}
          placeholder="https://… atau /uploads/banner.jpg"
          hint="Form ini menyimpan URL gambar; unggah berkas pada integrasi produksi."
          onChange={(value) => patch({ image_url: value })}
        />

        <TextField
          id="banner-link"
          label="Link tujuan"
          value={form.link_url}
          error={errors.link_url}
          placeholder="/products atau https://…"
          hint="Boleh path internal (mis. /collections/youngs-favourite) atau URL penuh."
          onChange={(value) => patch({ link_url: value })}
        />

        <div className="field__row">
          <TextField
            id="banner-order"
            label="Urutan tampil"
            type="number"
            min={0}
            value={String(form.sort_order)}
            error={errors.sort_order}
            hint="Angka lebih kecil tampil lebih dahulu."
            onChange={(value) => patch({ sort_order: Number(value) })}
          />

          <SelectField
            id="banner-active"
            label="Status tayang"
            value={form.is_active ? 'true' : 'false'}
            options={[
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Nonaktif' },
            ]}
            onChange={(value) => patch({ is_active: value === 'true' })}
          />
        </div>

        <div className="field__row">
          <TextField
            id="banner-start"
            label="Mulai tayang (opsional)"
            type="datetime-local"
            value={toDateTimeLocalValue(form.start_at)}
            hint="Kosongkan untuk tayang tanpa batas awal."
            onChange={(value) => patch({ start_at: fromDateTimeLocalValue(value) })}
          />

          <TextField
            id="banner-end"
            label="Selesai tayang (opsional)"
            type="datetime-local"
            value={toDateTimeLocalValue(form.end_at)}
            error={errors.end_at}
            hint="Kosongkan untuk tayang tanpa batas akhir."
            onChange={(value) => patch({ end_at: fromDateTimeLocalValue(value) })}
          />
        </div>

        <div className="banner-form__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => navigate('/admin/banners')}
            disabled={submitting}
          >
            Batal
          </button>
          <button type="submit" className="btn btn--admin" disabled={submitting}>
            {submitting ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Simpan banner'}
          </button>
        </div>
      </form>
    </div>
  );
}