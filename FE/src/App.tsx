import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { RequireAdmin } from './components/layout/RequireAdmin';
import { CategoryPage } from './pages/CategoryPage';
import { CollectionPage } from './pages/CollectionPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { AdminBannerFormPage } from './pages/admin/AdminBannerFormPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminCollectionsPage } from './pages/admin/AdminCollectionsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminSessionProvider } from './session/AdminSessionProvider';

/**
 * Route map.
 *
 * Public:  /  ·  /products  ·  /products/:slug  ·  /categories/:slug
 *          /collections  ·  /collections/:slug
 * Admin:   /admin  ·  /admin/products  ·  /admin/products/new
 *          /admin/products/:id/edit  ·  /admin/banners  ·  /admin/banners/new
 *          /admin/banners/:id/edit  ·  /admin/collections  ·  /admin/login
 */
export default function App() {
  return (
    <AdminSessionProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:slug" element={<CollectionPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="banners/new" element={<AdminBannerFormPage />} />
          <Route path="banners/:id/edit" element={<AdminBannerFormPage />} />
          <Route path="collections" element={<AdminCollectionsPage />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminSessionProvider>
  );
}