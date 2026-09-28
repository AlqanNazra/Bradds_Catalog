import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { StateBlock } from '../../components/common/StateBlock';
import { SmartImage } from '../../components/common/SmartImage';
import { useAsync } from '../../hooks/useAsync';
import { deleteBanner, fetchAdminBanners, updateBanner } from '../../services/adminApi';
import { toErrorMessage } from '../../types/api';
import type { Banner } from '../../types/catalog';
import './AdminBannersPage.css';

function formatSchedule(banner: Banner): string {
  if (!banner.start_at && !banner.end_at) return 'Tayang selamanya';
  const start = banner.start_at
    ? new Date(banner.start_at).toLocaleDateString('id-ID')
    : 'kapan saja';
  const end = banner.end_at ? new Date(banner.end_at).toLocaleDateString('id-ID') : 'tanpa batas';
  return `Jadwal: ${start} → ${end}`;
}

/**
 * `/admin/banners` — "Edit Main Board": list every banner (active or not, in or out of
 * its schedule), toggle visibility, reorder, and open the create/edit form.
 */
export function AdminBannersPage() {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => fetchAdminBanners(), []);
  const banners = useAsync(load, 'Banner tidak dapat dimuat.');
  const reload = banners.reload;

  async function toggleActive(banner: Banner) {
    setBusyId(banner.id);
    setActionError(null);
    try {
      await updateBanner(banner.id, { is_active: !banner.is_active });
      reload();
    } catch (reason: unknown) {
      setActionError(toErrorMessage(reason, 'Gagal mengubah status banner.'));
    } finally {
      setBusyId(null);
    }
  }

  async function move(banner: Banner, direction: -1 | 1) {
    const list = banners.data ?? [];
    const index = list.findIndex((item) => item.id === banner.id);
    const neighbour = list[index + direction];
    if (!neighbour) return;

    setBusyId(banner.id);
    setActionError(null);
    try {
      // Swaps sort_order with the neighbour so the public hero order stays stable.
      await updateBanner(banner.id, { sort_order: neighbour.sort_order });
      await updateBanner(neighbour.id, { sort_order: banner.sort_order });
      reload();
    } catch (reason: unknown) {
      setActionError(toErrorMessage(reason, 'Gagal mengubah urutan banner.'));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(banner: Banner) {
    setBusyId(banner.id);
    setActionError(null);
    try {
      await deleteBanner(banner.id);
      reload();
    } catch (reason: unknown) {
      setActionError(toErrorMessage(reason, 'Gagal menghapus banner.'));
    } finally {
      setBusyId(null);
    }
  }

  const list = banners.data ?? [];

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Edit Main Board</h1>
          <p className="admin-page__subtitle">
            Banner ini tampil sebagai hero di halaman utama, diurutkan berdasarkan nomor urut.
          </p>
        </div>
        <Link to="/admin/banners/new" className="btn btn--admin">
          + Tambah banner
        </Link>
      </header>

      {actionError && (
        <p className="field__error" role="alert">
          {actionError}
        </p>
      )}

      {banners.loading && <StateBlock variant="loading" title="Memuat banner…" />}

      {!banners.loading && banners.error && (
        <StateBlock
          variant="error"
          title="Banner tidak dapat dimuat"
          message={banners.error}
          onRetry={reload}
        />
      )}

      {!banners.loading && !banners.error && list.length === 0 && (
        <StateBlock
          variant="empty"
          title="Belum ada banner"
          message="Tambahkan banner pertama untuk mengisi hero halaman utama."
        />
      )}

      {!banners.loading && !banners.error && list.length > 0 && (
        <ul className="banner-admin__list">
          {list.map((banner, index) => (
            <li key={banner.id} className="banner-admin__item">
              <span className="banner-admin__order">#{banner.sort_order}</span>

              <span className="banner-admin__thumb">
                <SmartImage src={banner.image_url} alt={banner.title} placeholderLabel="Banner" />
              </span>

              <div className="banner-admin__body">
                <div className="banner-admin__title-row">
                  <h2 className="banner-admin__title">{banner.title}</h2>
                  <span
                    className={`status-pill status-pill--${banner.is_active ? 'success' : 'neutral'}`}
                  >
                    {banner.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                {banner.description && <p className="banner-admin__text">{banner.description}</p>}
                <p className="banner-admin__meta">
                  {banner.link_url ? `Link: ${banner.link_url}` : 'Tanpa link'} ·{' '}
                  {formatSchedule(banner)}
                </p>
              </div>

              <div className="banner-admin__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={index === 0 || busyId !== null}
                  onClick={() => move(banner, -1)}
                  aria-label={`Naikkan ${banner.title}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={index === list.length - 1 || busyId !== null}
                  onClick={() => move(banner, 1)}
                  aria-label={`Turunkan ${banner.title}`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={busyId !== null}
                  onClick={() => toggleActive(banner)}
                >
                  {banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <Link to={`/admin/banners/${banner.id}/edit`} className="btn btn--ghost btn--sm">
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  disabled={busyId !== null}
                  onClick={() => remove(banner)}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}