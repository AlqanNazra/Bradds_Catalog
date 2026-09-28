import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductTable } from '../../components/admin/ProductTable';
import { StatusCard } from '../../components/admin/StatusCard';
import { StateBlock } from '../../components/common/StateBlock';
import { useAsync } from '../../hooks/useAsync';
import { useAdminSession } from '../../session/adminSession';
import { deleteProduct, fetchAdminProducts, fetchProductStats } from '../../services/adminApi';
import type { Product } from '../../types/catalog';
import { toErrorMessage } from '../../types/api';
import { bucketTone, PRODUCT_BUCKET_LABELS } from '../../utils/product';
import './AdminDashboardPage.css';

/**
 * `/admin` — counters (Ready / Belum Siap / Tidak Dilanjut / Empty from `productBucket`)
 * plus an inline preview of the newest products.
 */
export function AdminDashboardPage() {
  const { admin } = useAdminSession();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadStats = useCallback(() => fetchProductStats(), []);
  const stats = useAsync(loadStats, 'Statistik tidak dapat dimuat.');

  const loadProducts = useCallback(
    () => fetchAdminProducts({ page: 1, per_page: 5, sort: 'newest' }),
    []
  );
  const products = useAsync(loadProducts, 'Produk tidak dapat dimuat.');

  const refreshProducts = products.reload;
  const refreshStats = stats.reload;

  async function handleDelete(product: Product) {
    setDeletingId(product.id);
    setActionError(null);
    try {
      await deleteProduct(product.id);
      refreshProducts();
      refreshStats();
    } catch (reason: unknown) {
      setActionError(toErrorMessage(reason, 'Gagal menghapus produk.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">
            Selamat datang{admin?.name ? `, ${admin.name}` : ''}
          </h1>
          <p className="admin-page__subtitle">
            Ringkasan status katalog Bradds berdasarkan data produk dan varian.
          </p>
        </div>
        <Link to="/admin/products/new" className="btn btn--admin">
          + Tambah produk
        </Link>
      </header>

      {stats.loading && <StateBlock variant="loading" title="Memuat statistik…" compact />}

      {!stats.loading && stats.error && (
        <StateBlock
          variant="error"
          title="Statistik tidak dapat dimuat"
          message={stats.error}
          onRetry={stats.reload}
          compact
        />
      )}

      {!stats.loading && !stats.error && stats.data && (
        <>
          <div className="admin-dashboard__cards">
            <StatusCard
              label={PRODUCT_BUCKET_LABELS.ready}
              value={stats.data.ready}
              tone={bucketTone('ready')}
              hint="Stok varian tersedia"
            />
            <StatusCard
              label={PRODUCT_BUCKET_LABELS.not_ready}
              value={stats.data.not_ready}
              tone={bucketTone('not_ready')}
              hint="Menunggu produksi"
            />
            <StatusCard
              label={PRODUCT_BUCKET_LABELS.discontinued}
              value={stats.data.discontinued}
              tone={bucketTone('discontinued')}
              hint="Tidak dijual lagi"
            />
            <StatusCard
              label={PRODUCT_BUCKET_LABELS.empty}
              value={stats.data.empty}
              tone={bucketTone('empty')}
              hint="Total stok varian 0"
            />
          </div>

          <div className="admin-dashboard__summary">
            <span>
              Total produk <strong>{stats.data.total}</strong>
            </span>
            <span>
              Produk aktif <strong>{stats.data.active_products}</strong>
            </span>
            <span>
              Total stok <strong>{stats.data.total_stock}</strong> pcs
            </span>
          </div>
        </>
      )}

      <section className="admin-dashboard__section">
        <div className="admin-dashboard__section-head">
          <h2 className="panel-title">Produk terbaru</h2>
          <Link to="/admin/products" className="btn btn--ghost btn--sm">
            Lihat semua
          </Link>
        </div>

        {products.loading && <StateBlock variant="loading" title="Memuat produk…" compact />}

        {!products.loading && products.error && (
          <StateBlock
            variant="error"
            title="Produk tidak dapat dimuat"
            message={products.error}
            onRetry={products.reload}
            compact
          />
        )}

        {!products.loading && !products.error && products.data && products.data.data.length > 0 && (
          <>
            {actionError && (
              <p className="field__error" role="alert">
                {actionError}
              </p>
            )}
            <ProductTable
              products={products.data.data}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </>
        )}

        {!products.loading && !products.error && products.data && products.data.data.length === 0 && (
          <StateBlock
            variant="empty"
            title="Belum ada produk"
            message="Tambahkan produk pertama melalui tombol “Tambah produk”."
            compact
          />
        )}
      </section>
    </div>
  );
}