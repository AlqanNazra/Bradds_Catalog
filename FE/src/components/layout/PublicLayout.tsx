import { Outlet } from 'react-router-dom';
import { SeedDataNotice } from '../common/SeedDataNotice';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function PublicLayout() {
  return (
    <div className="app">
      <Navbar />
      <SeedDataNotice />
      <main className="page">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
