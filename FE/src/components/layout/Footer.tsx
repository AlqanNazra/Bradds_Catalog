import { Link } from 'react-router-dom';
import { FOOTER_COLUMNS, SITE } from '../../config/site';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Link to="/" className="footer__brand-link">
            <span className="footer__brand-mark" aria-hidden="true">
              B
            </span>
            <span className="footer__brand-name">{SITE.brand}</span>
          </Link>
          <p className="footer__tagline">{SITE.tagline}</p>
          <ul className="footer__socials">
            {SITE.socials.map((social) => (
              <li key={social.label}>
                <a
                  className="footer__social"
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__columns">
          {FOOTER_COLUMNS.map((column) => (
            <section key={column.title} className="footer__column">
              <h2 className="footer__column-title">{column.title}</h2>
              <ul className="footer__links">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="footer__link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="footer__bottom">
        <span>
          © {new Date().getFullYear()} {SITE.brand}. All rights reserved.
        </span>
        <Link to="/admin" className="footer__admin-link">
          Panel Admin
        </Link>
      </div>
    </footer>
  );
}
