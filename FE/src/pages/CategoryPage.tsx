import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Pagination } from '../components/common/Pagination';
import { StateBlock } from '../components/common/StateBlock';
import { SmartImage } from '../components/common/SmartImage';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductListToolbar } from '../components/product/ProductListToolbar';
import { useAsync } from '../hooks/useAsync';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { fetchCategoryBySlug, fetchProducts } from '../services/catalogApi';
import './CatalogPage.css';
import './CatalogBanner.css';

/** `/categories/:slug` — products belonging to one category. */
export function CategoryPage() {
  const { slug = '' } = useParams();
  const { sort, query, update } = useCatalogQuery(12, slug);

  const loadCategory = useCallback(() => fetchCategoryBySlug(slug), [slug]);
  const category = useAsync(loadCategory, 'Kategori tidak dapat dimuat.');

  const loadProducts = useCallback(() => fetchProducts(query), [query]);
  const products = useAsync(loadProducts, 'Gagal memuat produk.');

  const result = products.data;

  return (
    <div className="catalog">
      <header className="page__header">
        <h1 className="page__title">{category.data?.name ?? 'Kategori'}</h1>
        <p className="page__subtitle">
          {category.data?.description || 'Produk pilihan pada kategori ini.'}
        </p>
      </header>

      {category.data?.image_url && (
        <div className="catalog__hero">
          <div className="catalog-banner">
            <SmartImage src={category.data.image_url} alt={category.data.name} eager />
          </div>
        </div>
      )}

      <ProductListToolbar
        sort={sort}
        onSortChange={(next) => update({ sort: next, page: null })}
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

        {!products.loading && !products.error && result && result.meta.total === 0 && (
          <StateBlock
            variant="empty"
            title="Belum ada produk di kategori ini"
            message="Produk akan muncul di sini setelah ditambahkan dari panel admin."
          />
        )}

        {!products.loading && !products.error && result && result.meta.total > 0 && (
          <>
            <ProductGrid products={result.data} />
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
