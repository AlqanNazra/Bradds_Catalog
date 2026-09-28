import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SeedDataNotice } from '../common/SeedDataNotice';
import { AdminSidebar } from './AdminSidebar';
import './AdminLayout.css';

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="admin-shell">
      <AdminSidebar open={drawerOpen} onNavigate={closeDrawer} />

      {drawerOpen && (
        <button
          type="button"
          className="admin-shell__scrim"
          aria-label="Tutup menu"
          onClick={closeDrawer}
        />
      )}

      <div className="admin-shell__body">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((value) => !value)}
          >
            Menu
          </button>
          <span className="admin-topbar__title">Panel Admin</span>
        </header>

        <SeedDataNotice />

        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
