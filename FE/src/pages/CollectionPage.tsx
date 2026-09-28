import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Pagination } from '../components/common/Pagination';
import { StateBlock } from '../components/common/StateBlock';
import { SmartImage } from '../components/common/SmartImage';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductListToolbar } from '../components/product/ProductListToolbar';
import { useAsync } from '../hooks/useAsync';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { fetchCollectionBySlug, fetchProducts } from '../services/catalogApi';
import './CatalogPage.css';
import './CatalogBanner.css';

/** `/collections/:slug` — destination of the homepage "Explore Now!" links. */
export function CollectionPage() {
  const { slug = '' } = useParams();
  const { sort, query, update } = useCatalogQuery(12, null, slug);

  const loadCollection = useCallback(() => fetchCollectionBySlug(slug), [slug]);
  const collection = useAsync(loadCollection, 'Koleksi tidak dapat dimuat.');

  const loadProducts = useCallback(() => fetchProducts(query), [query]);
  const products = useAsync(loadProducts, 'Gagal memuat produk.');

  const result = products.data;

  return (
    <div className="catalog">
      <header className="page__header">
        <h1 className="page__title">{collection.data?.name ?? 'Koleksi'}</h1>
        <p className="page__subtitle">
          {collection.data?.description || 'Koleksi pilihan dari Bradds.'}
        </p>
      </header>

      {collection.data?.image_url && (
        <div className="catalog__hero">
          <div className="catalog-banner">
            <SmartImage src={collection.data.image_url} alt={collection.data.name} eager />
          </div>
        </div>
      )}

      <ProductListToolbar sort={sort} onSortChange={(next) => update({ sort: next, page: null })} />

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
            title="Belum ada produk di koleksi ini"
            message="Tambahkan produk ke koleksi ini dari form produk pada panel admin."
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
