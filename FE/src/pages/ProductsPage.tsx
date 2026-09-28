import { useCallback } from 'react';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { useAsync } from '../hooks/useAsync';
import { fetchCategories, fetchProducts } from '../services/catalogApi';
import type { ProductSort } from '../types/catalog';
import { Pagination } from '../components/common/Pagination';
import { StateBlock } from '../components/common/StateBlock';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductListToolbar } from '../components/product/ProductListToolbar';
import './CatalogPage.css';

export function ProductsPage() {
  const { search, categorySlug, sort, query, update } = useCatalogQuery();

  const loadProducts = useCallback(() => fetchProducts(query), [query]);
  const products = useAsync(loadProducts, 'Gagal memuat produk.');

  const loadCategories = useCallback(() => fetchCategories(), []);
  const categories = useAsync(loadCategories, 'Gagal memuat kategori.');

  const result = products.data;

  return (
    <div className="catalog">
      <header className="page__header">
        <h1 className="page__title">Semua Produk</h1>
        <p className="page__subtitle">
          {result ? `${result.meta.total} produk tersedia` : 'Katalog Bradds: kaos, baju olahraga, kemeja, dan aksesoris.'}
        </p>
      </header>

      <ProductListToolbar
        search={{ value: search, onSubmit: (value) => update({ search: value || null, page: null }) }}
        categoryFilter={{
          categories: categories.data ?? [],
          value: categorySlug,
          onChange: (slug) => update({ category: slug || null, page: null }),
        }}
        sort={sort}
        onSortChange={(next: ProductSort) => update({ sort: next, page: null })}
      />

      <div className="catalog__body">
        {products.loading && <StateBlock variant="loading" title="Memuat produk…" />}

        {!products.loading && products.error && (
          <StateBlock
            variant="error"
            title="Produk tidak dapat dimuat"
            message={products.error}
            onRetry={products.reload}
          />
        )}

        {!products.loading && !products.error && result && (
          <>
            <ProductGrid
              products={result.data}
              emptyState={
                <StateBlock
                  variant="empty"
                  title="Tidak ada produk yang cocok"
                  message={
                    search || categorySlug
                      ? 'Coba ubah kata kunci pencarian atau pilih kategori lain.'
                      : 'Belum ada produk yang dipublikasikan.'
                  }
                />
              }
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
    </div>
  );
}
