import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductTable } from '../../components/admin/ProductTable';
import { Pagination } from '../../components/common/Pagination';
import { StateBlock } from '../../components/common/StateBlock';
import { ProductListToolbar } from '../../components/product/ProductListToolbar';
import { useAsync } from '../../hooks/useAsync';
import { useCatalogQuery } from '../../hooks/useCatalogQuery';
import { deleteProduct, fetchAdminProducts } from '../../services/adminApi';
import { fetchCategories } from '../../services/catalogApi';
import { toErrorMessage } from '../../types/api';
import type { Product } from '../../types/catalog';
import './AdminProductsPage.css';

/** `/admin/products` — "Data Produk": filtered/sorted table with search + pagination. */
export function AdminProductsPage() {
  const { search, categorySlug, sort, query, update } = useCatalogQuery(10);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadProducts = useCallback(() => fetchAdminProducts(query), [query]);
  const products = useAsync(loadProducts, 'Produk tidak dapat dimuat.');

  const loadCategories = useCallback(() => fetchCategories(), []);
  const categories = useAsync(loadCategories, 'Kategori tidak dapat dimuat.');

  const reload = products.reload;

  async function handleDelete(product: Product) {
    setDeletingId(product.id);
    setActionError(null);
    try {
      await deleteProduct(product.id);
      reload();
    } catch (reason: unknown) {
      setActionError(toErrorMessage(reason, 'Gagal menghapus produk.'));
    } finally {
      setDeletingId(null);
    }
  }

  const result = products.data;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Data Produk</h1>
          <p className="admin-page__subtitle">
            Kelola katalog: status, harga, varian (warna × ukuran), gambar, dan koleksi.
          </p>
        </div>
        <Link to="/admin/products/new" className="btn btn--admin">
          + Tambah produk
        </Link>
      </header>

      <ProductListToolbar
        search={{
          value: search,
          onSubmit: (value) => update({ search: value || null, page: null }),
        }}
        categoryFilter={{
          categories: categories.data ?? [],
          value: categorySlug,
          onChange: (slug) => update({ category: slug || null, page: null }),
        }}
        sort={sort}
        onSortChange={(next) => update({ sort: next, page: null })}
      />

      {actionError && (
        <p className="field__error" role="alert">
          {actionError}
        </p>
      )}

      {products.loading && <StateBlock variant="loading" title="Memuat produk…" />}

      {!products.loading && products.error && (
        <StateBlock
          variant="error"
          title="Produk tidak dapat dimuat"
          message={products.error}
          onRetry={reload}
        />
      )}

      {!products.loading && !products.error && result && result.meta.total === 0 && (
        <StateBlock
          variant="empty"
          title="Tidak ada produk"
          message={
            search || categorySlug
              ? 'Tidak ada produk yang cocok dengan filter saat ini.'
              : 'Tambahkan produk pertama untuk mulai mengisi katalog.'
          }
        />
      )}

      {!products.loading && !products.error && result && result.meta.total > 0 && (
        <>
          <ProductTable
            products={result.data}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.total_pages}
            total={result.meta.total}
            onChange={(nextPage) => update({ page: String(nextPage) })}
          />
        </>
      )}
    </div>
  );
}