import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StateBlock } from '../components/common/StateBlock';
import { SmartImage } from '../components/common/SmartImage';
import { useAsync } from '../hooks/useAsync';
import { fetchCollections } from '../services/catalogApi';
import './CollectionsPage.css';

/** `/collections` — index of every active collection (target of the "Styling" nav item). */
export function CollectionsPage() {
  const load = useCallback(() => fetchCollections(), []);
  const { data, loading, error, reload } = useAsync(load, 'Gagal memuat koleksi.');

  const collections = data ?? [];

  return (
    <div className="collections">
      <header className="page__header">
        <h1 className="page__title">Koleksi</h1>
        <p className="page__subtitle">Kurasi produk Bradds berdasarkan tema dan gaya.</p>
      </header>

      <div className="collections__body">
        {loading && <StateBlock variant="loading" title="Memuat koleksi…" />}

        {!loading && error && (
          <StateBlock variant="error" title="Koleksi tidak dapat dimuat" message={error} onRetry={reload} />
        )}

        {!loading && !error && collections.length === 0 && (
          <StateBlock
            variant="empty"
            title="Belum ada koleksi aktif"
            message="Koleksi aktif akan tampil di sini setelah ditambahkan dari panel admin."
          />
        )}

        {!loading && !error && collections.length > 0 && (
          <ul className="collections__list">
            {collections.map((collection) => (
              <li key={collection.id} className="collections__item">
                <Link to={`/collections/${collection.slug}`} className="collections__card">
                  <span className="collections__media">
                    <SmartImage src={collection.image_url} alt={collection.name} />
                  </span>
                  <span className="collections__body">
                    <span className="collections__title">{collection.name}</span>
                    <span className="collections__text">{collection.description}</span>
                    <span className="collections__link">Explore Now! →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
