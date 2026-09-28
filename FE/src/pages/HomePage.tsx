import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import { HeroBanner } from '../components/banner/HeroBanner';
import { CategoryNavigation } from '../components/category/CategoryNavigation';
import { StateBlock } from '../components/common/StateBlock';

import { useAsync } from '../hooks/useAsync';
import {
  fetchCollections,
  fetchProducts,
} from '../services/catalogApi';
import './HomePage.css';
const FEATURED_PRODUCTS: Record<number, number> = {
  1: 1,
};

export function HomePage() {
  /* =========================================
     COLLECTIONS
  ========================================= */
  const loadCollections = useCallback(
    () => fetchCollections(),
    [],
  );
  const {
    data: collectionsData,
    loading: collectionsLoading,
    error: collectionsError,
    reload: reloadCollections,
  } = useAsync(loadCollections,'Gagal memuat koleksi.',);

  /* =========================================
     PRODUCTS
  ========================================= */
  const loadProducts = useCallback(() => fetchProducts(),[],);
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useAsync(loadProducts,'Gagal memuat produk.',);
  const collections = collectionsData ?? [];
  const products = productsData?.data ?? [];
  /* =========================================
     FIND FEATURED PRODUCT
  ========================================= */
  const getFeaturedProduct = (collectionId: number) => {
    const productId = FEATURED_PRODUCTS[collectionId];

    if (!productId) {
      return undefined;
    }

    return products.find(
      (product) => product.id === productId,
    );
  };


  /* =========================================
     LOADING / ERROR
  ========================================= */

  const loading =
    collectionsLoading ||
    productsLoading;

  const error =
    collectionsError ||
    productsError;


  return (
    <div className="home">

      {/* =========================================
          MAIN HERO
      ========================================= */}

      <HeroBanner />


      {/* =========================================
          CATEGORY NAVIGATION
      ========================================= */}

      <CategoryNavigation />


      {/* =========================================
          HOMEPAGE CONTENT
      ========================================= */}

      <main className="home__content">

        {/* =========================================
            LOADING
        ========================================= */}

        {loading && (
          <StateBlock
            variant="loading"
            title="Memuat koleksi…"
          />
        )}


        {/* =========================================
            ERROR
        ========================================= */}

        {!loading && error && (
          <StateBlock
            variant="error"
            title="Koleksi tidak dapat dimuat"
            message={error}
            onRetry={reloadCollections}
          />
        )}


        {/* =========================================
            EMPTY
        ========================================= */}

        {!loading &&
          !error &&
          collections.length === 0 && (
            <StateBlock
              variant="empty"
              title="Belum ada koleksi aktif"
              message="Koleksi aktif akan tampil di sini."
            />
          )}


        {/* =========================================
            YOUNG'S FAVOURITE
        ========================================= */}

        {!loading &&
          !error &&
          collections.length > 0 && (

            <section className="home__young-favourite">

              {/* =====================================
                  SECTION HEADER
              ===================================== */}

              <header className="home__section-header">

                <h2 className="home__section-title">
                  Young's Favourite
                </h2>

                <p className="home__section-description">
                  Potongan favorit anak muda:
                  oversized tee, flanel, dan jersey.
                </p>

              </header>


              {/* =====================================
                  PRODUCT HIGHLIGHTS
              ===================================== */}

              <div className="home__product-highlights">

                {collections.map((collection) => {

                  const featuredProduct =
                    getFeaturedProduct(collection.id);


                  /*
                   * Jika collection belum mempunyai
                   * featured product, jangan render
                   * hero kosong.
                   */
                  if (!featuredProduct) {
                    return null;
                  }


                  return (
                    <article
                      key={collection.id}
                      className="home__product-hero"
                    >

                      {/* =================================
                          COLLECTION LABEL
                      ================================= */}

                      <div className="home__product-label">

                        <h3>
                          {collection.name}
                        </h3>

                        <span />

                      </div>


                      {/* =================================
                          FULL WIDTH PRODUCT HERO

                          Klik gambar / seluruh hero
                          langsung menuju PRODUCT DETAIL.
                      ================================= */}

                      <Link
                        to={`/products/${featuredProduct.slug}`}
                        className="home__product-hero-link"
                        aria-label={`Lihat ${featuredProduct.name}`}
                      >

                        {/* ===============================
                            IMAGE
                        =============================== */}

                        <div className="home__product-image">

                          <img
                            src={collection.image_url}
                            alt={featuredProduct.name}
                          />

                        </div>


                        {/* ===============================
                            TEXT OVERLAY
                        =============================== */}

                        <div className="home__product-overlay">

                          <div className="home__product-copy">

                            <h4>
                              {featuredProduct.name}
                            </h4>

                            <p>
                              {featuredProduct.description}
                            </p>

                            <span>
                              Explore Now →
                            </span>

                          </div>

                        </div>

                      </Link>

                    </article>
                  );
                })}

              </div>

            </section>
          )}

      </main>

    </div>
  );
}