import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, SITE } from '../../config/site';
import './Navbar.css';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();

  /** Every navigation closes the overlays, so no route-change effect is needed. */
  function closeOverlays() {
    setMenuOpen(false);
    setSearchOpen(false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = term.trim();
    navigate(value ? `/products?search=${encodeURIComponent(value)}` : '/products');
    setSearchOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand" aria-label={`${SITE.brand} — beranda`}>
          <span className="navbar__brand-mark" aria-hidden="true">
            B
          </span>
          <span className="navbar__brand-name">{SITE.brand}</span>
        </Link>

        <nav className="navbar__nav" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={closeOverlays}
              className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <button
            type="button"
            className="navbar__icon-button"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((value) => !value)}
          >
            <span className="sr-only">{searchOpen ? 'Tutup pencarian' : 'Cari produk'}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            className="navbar__toggle"
            aria-expanded={menuOpen}
            aria-controls="navbar-mobile"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="sr-only">{menuOpen ? 'Tutup menu' : 'Buka menu'}</span>
            <span className="navbar__toggle-bar" aria-hidden="true" />
            <span className="navbar__toggle-bar" aria-hidden="true" />
            <span className="navbar__toggle-bar" aria-hidden="true" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <form className="navbar__search" onSubmit={submitSearch} role="search">
          <input
            className="navbar__search-input"
            type="search"
            value={term}
            placeholder="Cari kaos, kemeja, jersey…"
            aria-label="Kata kunci pencarian produk"
            onChange={(event) => setTerm(event.target.value)}
          />
          <button type="submit" className="btn btn--outline btn--sm">
            Cari
          </button>
        </form>
      )}

      {menuOpen && (
        <nav id="navbar-mobile" className="navbar__mobile" aria-label="Navigasi mobile">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="navbar__mobile-link"
              onClick={closeOverlays}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
