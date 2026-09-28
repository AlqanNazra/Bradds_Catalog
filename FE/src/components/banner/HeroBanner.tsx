import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAsync } from '../../hooks/useAsync';
import { fetchBanners } from '../../services/catalogApi';
import { SmartImage } from '../common/SmartImage';

import './HeroBanner.css';

const ROTATE_MS = 7000;

/**
 * Homepage hero.
 *
 * - Banner aktif ditampilkan berdasarkan sort_order.
 * - Banner otomatis berganti setiap 7 detik.
 * - Hanya area gambar yang dapat diklik untuk menuju collection.
 * - Dots digunakan untuk berpindah banner secara manual.
 */
export function HeroBanner() {
  const load = useCallback(() => fetchBanners(), []);

  const { data, loading, error } = useAsync(
    load,
    'Banner tidak dapat dimuat.',
  );

  const banners = data ?? [];

  const [rotateIndex, setRotateIndex] = useState(0);

  const index =
    banners.length > 0
      ? rotateIndex % banners.length
      : 0;

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setRotateIndex((value) => value + 1);
    }, ROTATE_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [banners.length]);

  if (loading) {
    return (
      <div
        className="hero-banner hero-banner--loading"
        aria-busy="true"
      />
    );
  }

  if (error || banners.length === 0) {
    return (
      <section className="hero-banner hero-banner--empty">
        <div className="hero-banner__placeholder">
          <p className="hero-banner__placeholder-title">
            {error
              ? 'Banner belum dapat dimuat'
              : 'Belum ada banner aktif'}
          </p>

          <p className="hero-banner__placeholder-text">
            {error
              ? 'Coba muat ulang halaman ini.'
              : 'Tambahkan banner dari menu Edit Main Board pada panel admin.'}
          </p>
        </div>
      </section>
    );
  }

  const active = banners[index];

  return (
    <section className="hero-banner">
      {/* =========================================
          CLICKABLE IMAGE
          ========================================= */}
      <Link
        to={active.link_url || '#'}
        className="hero-banner__image-link"
        aria-label={`Lihat koleksi ${active.title}`}
      >
        <div className="hero-banner__media">
          <SmartImage
            src={active.image_url}
            alt={active.title}
          />
        </div>
      </Link>

      {/* =========================================
          TEXT
          ========================================= */}
      <div className="hero-banner__overlay">
        <div className="hero-banner__content">
          <h1 className="hero-banner__title">
            {active.title}
          </h1>

          {active.description && (
            <p className="hero-banner__description">
              {active.description}
            </p>
          )}
        </div>
      </div>

      {/* =========================================
          SLIDER DOTS
          ========================================= */}
      {banners.length > 1 && (
        <div
          className="hero-banner__dots"
          role="tablist"
          aria-label="Pilih banner"
        >
          {banners.map((banner, dotIndex) => (
            <button
              key={banner.id}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Banner ${dotIndex + 1}: ${banner.title}`}
              className={`hero-banner__dot${
                dotIndex === index
                  ? ' hero-banner__dot--active'
                  : ''
              }`}
              onClick={() => setRotateIndex(dotIndex)}
            />
          ))}
        </div>
      )}
    </section>
  );
}