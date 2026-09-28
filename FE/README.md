# Bradds — Fashion Catalog (Web)

Frontend untuk katalog fashion Bradds: katalog publik (hero banner, kategori, koleksi,
detail produk dengan pemilih warna × ukuran) plus panel admin (dashboard status, Data
Produk, Edit Main Board/banner, Koleksi).

Dibangun mengikuti konvensi project sebelah:

- **Vite + React 19 + TypeScript**, tanpa state library (Context + hooks saja)
- **CSS polos per komponen** (BEM, `Component.tsx` + `Component.css`), tanpa Tailwind
- **Routing** `react-router-dom` (satu-satunya dependensi tambahan)
- **API layer** `fetch` bertipe di `src/services/*.ts`, dengan envelope `{ data: ... }`
  dan error `{ error: "..." }` sesuai handler Go/Gin (`../go-gin-article`)
- Lint: **oxlint** (`.oxlintrc.json`)

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173 — proxy /api → http://localhost:8080
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run build      # tsc -b && vite build
npm run preview
```

## Route

| Route | Halaman |
| --- | --- |
| `/` | Homepage: hero banner, strip kategori, satu section per koleksi, CTA merah |
| `/products` | Katalog: pencarian, filter kategori, urutkan, paginasi (state di URL) |
| `/products/:slug` | Detail produk: galeri, pemilih warna/ukuran, akordeon, ORDER NOW |
| `/categories/:slug` | Produk per kategori |
| `/collections` | Daftar koleksi aktif |
| `/collections/:slug` | Produk per koleksi (target link "Explore Now!") |
| `/admin/login` | Masuk panel admin |
| `/admin` | Dashboard: kartu Ready / Belum Siap / Tidak Dilanjut / Empty |
| `/admin/products` | Data Produk (tabel + hapus + filter) |
| `/admin/products/new`, `/admin/products/:id/edit` | Form produk (info, gambar, varian, koleksi) |
| `/admin/banners`, `/admin/banners/new`, `/admin/banners/:id/edit` | Edit Main Board |
| `/admin/collections` | CRUD koleksi |

## Model domain

`src/types/catalog.ts` memetakan domain langsung ke wire DTO (snake_case):

```
Category 1──N Product 1──N ProductImage
             Product 1──N ProductVariant N──1 Color, N──1 Size
             Product N──M Collection (junction ProductCollection)
Banner (konsep "Main Board" pada UI admin)
```

Catatan turunan (tidak disimpan di DB):

- `totalStock = Σ stok varian aktif`
- Bucket dashboard `empty` = produk tanpa stok varian; produk `discontinued` selalu masuk
  bucket "Tidak Dilanjut"
- Harga yang tampil = rentang harga varian (fallback ke harga produk)

## Layer API

`src/services/http.ts` menyediakan `request` / `requestPage` (membaca `{ data }` dan
`{ data, meta }`), token Bearer opsional, dan `isUsingSeedData()`.

Endpoint yang dipakai:

```
GET    /api/banners             GET /api/categories          GET /api/collections
GET    /api/products?…          GET /api/products/:slug      GET /api/colors  /api/sizes
GET    /api/admin/stats         GET /api/admin/products      GET /api/admin/products/:id
POST   /api/admin/products      PUT|DELETE /api/admin/products/:id
GET    /api/admin/banners       POST /api/admin/banners      PUT|DELETE /api/admin/banners/:id
GET    /api/admin/collections   POST /api/admin/collections  PUT|DELETE /api/admin/collections/:id
POST   /api/admin/uploads       POST /api/admin/login        GET /api/admin/me   POST /api/admin/logout
```

### Mode demo (seed lokal)

Selama endpoint katalog/admin belum ada, `requestWithFallback` / `requestPageWithFallback`
otomatis memakai data seed di `src/services/mockDb.ts` (bentuk respons identik dengan API),
dan notice "Mode demo" muncul di UI (`SeedDataNotice`, memakai `useSyncExternalStore`).

Saat backend siap:

1. Hapus `src/services/mockDb.ts`.
2. Ganti `*WithFallback` menjadi `request` / `requestPage` di `catalogApi.ts` dan `adminApi.ts`.
3. Hapus `components/common/SeedDataNotice.*` beserta pemakaiannya di `PublicLayout` /
   `AdminLayout`, dan fungsi `subscribeSeedData`/`isUsingSeedData` di `http.ts`.

## Catatan implementasi

- **Form produk** mengirim agregat lengkap (`ProductInput`: produk + `images` + `variants` +
  `collection_ids`). Validasi di `src/utils/validation.ts` menolak SKU ganda, kombinasi
  warna/ukuran ganda, harga ≤ 0, stok negatif, dan slug tidak valid.
- **Gambar** hanya disimpan sebagai URL (`ProductImage.image_url`); unggahan memakai
  `POST /api/admin/uploads` dan jatuh kembali ke object URL lokal saat endpoint belum ada.
- **Sesi admin**: `AdminSessionProvider` memanggil `/api/admin/me` saat boot; mock login
  menerima email/password apa pun. `http.ts` mengirim token sebagai `Authorization: Bearer`.
- Mockup menampilkan rating bintang dan panel "Fitur"; keduanya tidak dirender karena tidak
  ada di model domain — tidak ada field fiktif yang ditambahkan.
- Penyesuaian state dilakukan saat render (pola resmi React) alih-alih `useEffect`, sehingga
  `oxlint` bersih tanpa warning `set-state-in-effect`.

## Struktur

```
src/
  components/
    admin/      FormFields, ImageUploader, ProductForm, ProductTable, StatusCard, VariantEditor
    banner/     HeroBanner
    category/   CategoryNavigation
    collection/ CollectionSection
    common/     Pagination, SeedDataNotice, SmartImage, StateBlock, StatusPill
    layout/     Navbar, Footer, PublicLayout, AdminLayout, AdminSidebar, RequireAdmin
    product/    ProductCard, ProductGrid, ProductGallery, ProductInfo,
                ProductVariantSelector, ColorSelector, SizeSelector,
                ProductAccordion, ProductListToolbar
  config/     site.ts (copy navbar/footer/CTA)
  hooks/      useAsync, useCatalogQuery
  pages/      HomePage, ProductsPage, ProductDetailPage, CategoryPage,
              CollectionsPage, CollectionPage, NotFoundPage
  pages/admin/ AdminDashboardPage, AdminProductsPage, AdminProductFormPage, AdminBannersPage,
               AdminBannerFormPage, AdminCollectionsPage, AdminLoginPage
  services/   http, catalogApi, adminApi, mockDb
  session/    adminSession (context), AdminSessionProvider
  types/      catalog.ts, admin.ts, api.ts
  utils/      format.ts, product.ts, validation.ts
```