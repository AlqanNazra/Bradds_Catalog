import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export function NotFoundPage() {
  return (
    <div className="not-found">
      <p className="not-found__code">404</p>
      <h1 className="not-found__title">Halaman tidak ditemukan</h1>
      <p className="not-found__text">
        Tautan yang Anda buka tidak tersedia. Coba mulai dari katalog produk.
      </p>
      <div className="not-found__actions">
        <Link to="/" className="btn btn--outline">
          Beranda
        </Link>
        <Link to="/products" className="btn btn--primary">
          Lihat katalog
        </Link>
      </div>
    </div>
  );
}
