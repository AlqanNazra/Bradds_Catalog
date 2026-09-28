import { Link, NavLink } from 'react-router-dom';
import { useAdminSession } from '../../session/adminSession';
import { SITE } from '../../config/site';
import './AdminSidebar.css';

interface AdminSidebarProps {
  open: boolean;
  onNavigate: () => void;
}

/** Menu mirrors the mockup: "Main Menu" + "Management" groups. */
const MENU_GROUPS = [
  {
    title: 'Main Menu',
    items: [
      { label: 'Dashboard', to: '/admin', end: true },
      { label: 'Data Produk', to: '/admin/products', end: false },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Edit Main Board', to: '/admin/banners', end: false },
      { label: 'Koleksi', to: '/admin/collections', end: false },
    ],
  },
];

export function AdminSidebar({ open, onNavigate }: AdminSidebarProps) {
  const { admin, signOut } = useAdminSession();

  return (
    <aside className={`admin-sidebar${open ? ' admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__brand-mark" aria-hidden="true">
          B
        </span>
        <span className="admin-sidebar__brand-name">{SITE.brand}</span>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Menu admin">
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="admin-sidebar__group">
            <p className="admin-sidebar__group-title">{group.title}</p>
            <ul className="admin-sidebar__list">
              {group.items.map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <Link to="/" className="admin-sidebar__site-link">
          ← Lihat situs
        </Link>

        <div className="admin-sidebar__profile">
          <span className="admin-sidebar__avatar" aria-hidden="true">
            {(admin?.name ?? 'A').slice(0, 1).toUpperCase()}
          </span>
          <span className="admin-sidebar__profile-text">
            <strong>{admin?.name ?? 'Belum masuk'}</strong>
            <small>{admin?.role ?? 'Administrator'}</small>
          </span>
        </div>

        <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={signOut}>
          Keluar
        </button>
      </div>
    </aside>
  );
}
