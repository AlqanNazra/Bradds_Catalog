import type { BannerInput, CollectionInput, ProductInput, ProductStats } from '../types/admin';
import { emptyPage, type Paginated } from '../types/api';
import { productBucket, totalStock } from '../utils/product';
import type {
  AdminUser,
  Banner,
  Category,
  Collection,
  Color,
  Product,
  ProductCollection,
  ProductImage,
  ProductQuery,
  ProductSort,
  ProductStatus,
  ProductVariant,
  Size,
} from '../types/catalog';

/**
 * Local seed data + an in-memory store that emulates the Gin handlers.
 *
 * It exists so the UI is fully usable (including admin mutations) before the Go
 * endpoints for products/categories/collections/banners are implemented. The shapes
 * are identical to the expected API responses — delete this file and the
 * `*WithFallback` calls in catalogApi.ts / adminApi.ts once the backend is live.
 */

const CREATED_AT = '2026-01-05T08:00:00Z';
const UPDATED_AT = '2026-08-18T04:30:00Z';

function seedUrl(seed: string): string {
  return `https://picsum.photos/seed/bradds-${seed}/1000/1250`;
}

/* ── Reference tables ─────────────────────────────────────────────────────── */

const COLORS: Color[] = [
  { id: 1, name: 'Merah', hex_code: '#E11D1D', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 2, name: 'Biru', hex_code: '#1D6FE1', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 3, name: 'Tosca', hex_code: '#2ED3C6', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 4, name: 'Ungu', hex_code: '#8B2FD6', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 5, name: 'Oranye', hex_code: '#F2761F', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 6, name: 'Hijau Limau', hex_code: '#7BD82F', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 7, name: 'Magenta', hex_code: '#D61F9A', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 8, name: 'Hijau', hex_code: '#1FBF6B', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 9, name: 'Hitam', hex_code: '#111111', created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 10, name: 'Putih', hex_code: '#F4F4F4', created_at: CREATED_AT, updated_at: UPDATED_AT },
];

const SIZES: Size[] = [
  { id: 6, name: 'All Size', sort_order: 0, created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 1, name: 'S', sort_order: 1, created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 2, name: 'M', sort_order: 2, created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 3, name: 'L', sort_order: 3, created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 4, name: 'XL', sort_order: 4, created_at: CREATED_AT, updated_at: UPDATED_AT },
  { id: 5, name: 'XXL', sort_order: 5, created_at: CREATED_AT, updated_at: UPDATED_AT },
];

const ADMIN_USER: AdminUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@bradds.id',
  role: 'Administrator',
  created_at: CREATED_AT,
  updated_at: UPDATED_AT,
};

const CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Kaos',
    slug: 'kaos',
    description: 'Kaos katun combed dan oversized tee untuk pemakaian harian.',
    image_url: seedUrl('kategori-kaos'),
    is_active: true,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
  {
    id: 2,
    name: 'Baju Olahraga',
    slug: 'baju-olahraga',
    description: 'Jersey dan setelan training dengan bahan dry-fit.',
    image_url: seedUrl('kategori-baju-olahraga'),
    is_active: true,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
  {
    id: 3,
    name: 'Kemeja',
    slug: 'kemeja',
    description: 'Kemeja batik, flanel, dan linen dengan potongan modern.',
    image_url: seedUrl('kategori-kemeja'),
    is_active: true,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
  {
    id: 4,
    name: 'Aksesoris',
    slug: 'aksesoris',
    description: 'Tote bag, topi, dan aksesoris penunjang gaya harian.',
    image_url: seedUrl('kategori-aksesoris'),
    is_active: true,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
];

const COLLECTIONS: Collection[] = [
  {
    id: 1,
    name: "Young's Favourite",
    slug: 'youngs-favourite',
    description: 'Potongan favorit anak muda: oversized tee, flanel, dan jersey.',
    image_url: seedUrl('koleksi-youngs-favourite'),
    is_active: true,
    sort_order: 1,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
  {
    id: 2,
    name: 'Trending on Instagram',
    slug: 'trending-on-instagram',
    description: 'Produk yang paling banyak dibagikan dari feed kami.',
    image_url: seedUrl('koleksi-trending-instagram'),
    is_active: true,
    sort_order: 2,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
  {
    id: 3,
    name: 'All Under $40',
    slug: 'all-under-40',
    description: 'Pilihan hemat di bawah Rp 400.000 untuk keseharian.',
    image_url: seedUrl('koleksi-all-under-40'),
    is_active: true,
    sort_order: 3,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
];


/* ── Seed builders ───────────────────────────────────────────────────────── */

interface VariantSeed {
  colorId: number;
  sizeId: number;
  sku: string;
  stock: number;
  price?: number;
  active?: boolean;
}

interface ProductSeed {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  material: string;
  careInstruction: string;
  status: ProductStatus;
  /** picsum seeds — replaced by real `image_url` values from the API/storage. */
  images: string[];
  variants: VariantSeed[];
  collectionIds: number[];
}

function findColor(id: number): Color {
  return COLORS.find((color) => color.id === id) ?? COLORS[0];
}

function findSize(id: number): Size {
  return SIZES.find((size) => size.id === id) ?? SIZES[0];
}

function buildVariant(productId: number, seed: VariantSeed, index: number): ProductVariant {
  const color = findColor(seed.colorId);
  const size = findSize(seed.sizeId);
  return {
    id: productId * 100 + index + 1,
    product_id: productId,
    color_id: color.id,
    size_id: size.id,
    sku: seed.sku,
    stock: seed.stock,
    price: seed.price ?? 0,
    is_active: seed.active ?? true,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
    color,
    size,
  };
}

function buildProduct(seed: ProductSeed): Product {
  const images: ProductImage[] = seed.images.map((imageSeed, index) => ({
    id: seed.id * 10 + index + 1,
    product_id: seed.id,
    image_url: seedUrl(imageSeed),
    alt_text: `${seed.name} — tampilan ${index + 1}`,
    sort_order: index,
    is_primary: index === 0,
    created_at: CREATED_AT,
  }));

  return {
    id: seed.id,
    category_id: seed.categoryId,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    price: seed.price,
    material: seed.material,
    care_instruction: seed.careInstruction,
    status: seed.status,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
    category: CATEGORIES.find((category) => category.id === seed.categoryId) ?? null,
    images,
    variants: seed.variants.map((variant, index) => buildVariant(seed.id, variant, index)),
    collections: [],
  };
}

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: 1,
    categoryId: 1,
    name: 'Assassins: Ambaditore Oversized Tee',
    slug: 'assassins-ambaditore-oversized-tee',
    description:
      'Oversized tee katun combed 24s dengan sablon grafis Assassin di bagian depan. Potongan boxy dengan bahu jatuh, nyaman dipakai harian maupun untuk layering.',
    price: 300000,
    material: 'Katun combed 24s, sablon plastisol',
    careInstruction:
      'Cuci dengan air dingin, jangan gunakan pemutih, setrika suhu sedang dari sisi dalam.',
    status: 'ready',
    images: ['assassins-tee-1', 'assassins-tee-2', 'assassins-tee-3'],
    variants: [
      { colorId: 9, sizeId: 1, sku: 'BRD-AMA-BLK-S', stock: 10 },
      { colorId: 9, sizeId: 2, sku: 'BRD-AMA-BLK-M', stock: 20 },
      { colorId: 9, sizeId: 3, sku: 'BRD-AMA-BLK-L', stock: 15 },
      { colorId: 10, sizeId: 2, sku: 'BRD-AMA-WHT-M', stock: 8 },
      { colorId: 1, sizeId: 3, sku: 'BRD-AMA-RED-L', stock: 5 },
      { colorId: 1, sizeId: 4, sku: 'BRD-AMA-RED-XL', stock: 0 },
    ],
    collectionIds: [1, 2],
  },
  {
    id: 2,
    categoryId: 1,
    name: 'Kaos Basic Combed 30s',
    slug: 'kaos-basic-combed-30s',
    description:
      'Kaos polos berbahan combed 30s dengan jahitan rantai pada bagian bawah. Pilihan aman untuk kebutuhan harian.',
    price: 129000,
    material: 'Katun combed 30s',
    careInstruction: 'Cuci mesin suhu normal, jangan gunakan pemutih, keringkan dengan cara diangin-anginkan.',
    status: 'ready',
    images: ['kaos-basic-1', 'kaos-basic-2'],
    variants: [
      { colorId: 9, sizeId: 1, sku: 'BRD-KBC-BLK-S', stock: 24 },
      { colorId: 9, sizeId: 2, sku: 'BRD-KBC-BLK-M', stock: 30 },
      { colorId: 9, sizeId: 3, sku: 'BRD-KBC-BLK-L', stock: 18 },
      { colorId: 10, sizeId: 2, sku: 'BRD-KBC-WHT-M', stock: 12 },
      { colorId: 2, sizeId: 3, sku: 'BRD-KBC-BLU-L', stock: 9 },
    ],
    collectionIds: [1, 3],
  },
  {
    id: 3,
    categoryId: 1,
    name: 'Kaos Graphic Castle Series',
    slug: 'kaos-graphic-castle-series',
    description:
      'Kaos grafis seri Castle dengan sablon waterbased. Produksi tahap kedua masih menunggu konfirmasi vendor sablon.',
    price: 175000,
    material: 'Katun combed 24s, sablon waterbased',
    careInstruction: 'Balik kaos sebelum dicuci, hindari pengeringan dengan mesin.',
    status: 'not_ready',
    images: ['kaos-castle-1'],
    variants: [
      { colorId: 9, sizeId: 1, sku: 'BRD-KGC-BLK-S', stock: 0 },
      { colorId: 9, sizeId: 2, sku: 'BRD-KGC-BLK-M', stock: 0 },
    ],
    collectionIds: [2],
  },
  {
    id: 4,
    categoryId: 2,
    name: 'Jersey Futsal Pro Dry-Fit',
    slug: 'jersey-futsal-pro-dry-fit',
    description:
      'Jersey futsal dengan bahan dry-fit dan panel mesh pada sisi badan. Tersedia opsi nama dan nomor punggung saat pemesanan.',
    price: 249000,
    material: 'Polyester dry-fit, panel mesh',
    careInstruction: 'Cuci tangan dengan air dingin, jangan diperas, hindari sinar matahari langsung.',
    status: 'ready',
    images: ['jersey-futsal-1', 'jersey-futsal-2'],
    variants: [
      { colorId: 1, sizeId: 2, sku: 'BRD-JFP-RED-M', stock: 14, price: 249000 },
      { colorId: 1, sizeId: 3, sku: 'BRD-JFP-RED-L', stock: 11 },
      { colorId: 2, sizeId: 3, sku: 'BRD-JFP-BLU-L', stock: 7 },
      { colorId: 8, sizeId: 4, sku: 'BRD-JFP-GRN-XL', stock: 6 },
    ],
    collectionIds: [1, 3],
  },
  {
    id: 5,
    categoryId: 2,
    name: 'Setelan Training Dry-Fit',
    slug: 'setelan-training-dry-fit',
    description:
      'Setelan training dua keping dengan bahan dry-fit ringan dan saku samping beresleting. Cocok untuk sesi latihan indoor maupun outdoor.',
    price: 359000,
    material: 'Polyester dry-fit, ripstop ringan',
    careInstruction: 'Cuci mesin suhu rendah, jangan gunakan pemutih, gantung untuk mengeringkan.',
    status: 'ready',
    images: ['training-set-1', 'training-set-2', 'training-set-3'],
    variants: [
      { colorId: 9, sizeId: 2, sku: 'BRD-STF-BLK-M', stock: 9 },
      { colorId: 9, sizeId: 3, sku: 'BRD-STF-BLK-L', stock: 13 },
      { colorId: 10, sizeId: 3, sku: 'BRD-STF-WHT-L', stock: 4 },
    ],
    collectionIds: [3],
  },
  {
    id: 6,
    categoryId: 3,
    name: 'Kemeja Batik Lengan Panjang',
    slug: 'kemeja-batik-lengan-panjang',
    description:
      'Kemeja batik cap dengan motif parang dan potongan regular fit. Bahan katun primisima yang adem untuk acara formal maupun semiformal.',
    price: 425000,
    material: 'Katun primisima batik cap',
    careInstruction: 'Cuci tangan dengan sabun lembut, jangan diperas, setrika suhu sedang.',
    status: 'ready',
    images: ['kemeja-batik-1', 'kemeja-batik-2'],
    variants: [
      { colorId: 5, sizeId: 2, sku: 'BRD-KBP-ORG-M', stock: 6 },
      { colorId: 5, sizeId: 3, sku: 'BRD-KBP-ORG-L', stock: 8 },
      { colorId: 4, sizeId: 3, sku: 'BRD-KBP-PUR-L', stock: 5 },
    ],
    collectionIds: [2],
  },
  {
    id: 7,
    categoryId: 3,
    name: 'Kemeja Flanel Oversize',
    slug: 'kemeja-flanel-oversize',
    description:
      'Kemeja flanel potongan oversize dengan bahan katun flanel brushed. Bisa dipakai terbuka sebagai outer.',
    price: 389000,
    material: 'Katun flanel brushed',
    careInstruction: 'Cuci mesin suhu dingin, jangan gunakan pemutih, setrika suhu sedang.',
    status: 'ready',
    images: ['kemeja-flanel-1', 'kemeja-flanel-2'],
    variants: [
      { colorId: 1, sizeId: 2, sku: 'BRD-KFO-RED-M', stock: 12 },
      { colorId: 1, sizeId: 3, sku: 'BRD-KFO-RED-L', stock: 10 },
      { colorId: 2, sizeId: 3, sku: 'BRD-KFO-BLU-L', stock: 3 },
      { colorId: 2, sizeId: 4, sku: 'BRD-KFO-BLU-XL', stock: 0 },
    ],
    collectionIds: [1, 3],
  },
  {
    id: 8,
    categoryId: 3,
    name: 'Kemeja Linen Premium',
    slug: 'kemeja-linen-premium',
    description:
      'Kemeja linen tenun premium dengan kerah klasik. Produksi dihentikan karena supplier kain tidak lagi menyediakan warna yang sama.',
    price: 459000,
    material: 'Linen tenun 100%',
    careInstruction: 'Cuci tangan, jangan diperas, setrika saat masih sedikit lembap.',
    status: 'discontinued',
    images: ['kemeja-linen-1'],
    variants: [
      { colorId: 10, sizeId: 3, sku: 'BRD-KLP-WHT-L', stock: 2, active: false },
      { colorId: 3, sizeId: 3, sku: 'BRD-KLP-TOS-L', stock: 1, active: false },
    ],
    collectionIds: [],
  },
  {
    id: 9,
    categoryId: 4,
    name: 'Tote Bag Kanvas Bradds',
    slug: 'tote-bag-kanvas-bradds',
    description:
      'Tote bag kanvas 12 oz dengan sablon logo Bradds dan kantong dalam. Kuat menahan beban belanja harian.',
    price: 149000,
    material: 'Kanvas 12 oz, webbing katun',
    careInstruction: 'Cuci tangan dengan sikat lembut, jangan gunakan pemutih.',
    status: 'ready',
    images: ['tote-bag-1', 'tote-bag-2'],
    variants: [
      { colorId: 10, sizeId: 6, sku: 'BRD-TBK-WHT-OS', stock: 40 },
      { colorId: 9, sizeId: 6, sku: 'BRD-TBK-BLK-OS', stock: 25 },
    ],
    collectionIds: [1, 3],
  },
  {
    id: 10,
    categoryId: 4,
    name: 'Topi Baseball Bradds',
    slug: 'topi-baseball-bradds',
    description:
      'Topi baseball enam panel dengan bordir logo Bradds dan strap belakang yang dapat disesuaikan.',
    price: 119000,
    material: 'Twill katun, bordir',
    careInstruction: 'Cuci tangan, keringkan dengan cara diangin-anginkan, jangan disetrika langsung pada bordir.',
    status: 'ready',
    images: ['topi-1'],
    variants: [
      { colorId: 9, sizeId: 6, sku: 'BRD-TBB-BLK-OS', stock: 0 },
      { colorId: 5, sizeId: 6, sku: 'BRD-TBB-ORG-OS', stock: 0 },
    ],
    collectionIds: [3],
  },

];

const BANNER_SEEDS: Banner[] = [
  {
    id: 1,
    title: 'Assassins: Ambaditore',
    description: 'Oversized tee grafis Assassin — drop terbatas dengan bahan katun combed 24s.',
    image_url: seedUrl('banner-assassins'),
    link_url: '/products/assassins-ambaditore-oversized-tee',
    sort_order: 1,
    is_active: true,
    start_at: null,
    end_at: null,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
  {
    id: 2,
    title: "Young's Favourite Drop",
    description: 'Kurasi potongan favorit: flanel oversize, jersey dry-fit, dan tote bag kanvas.',
    image_url: seedUrl('banner-youngs-favourite'),
    link_url: '/collections/youngs-favourite',
    sort_order: 2,
    is_active: true,
    start_at: null,
    end_at: null,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
  {
    id: 3,
    title: 'All Under $40',
    description: 'Pilihan hemat di bawah Rp 400.000 untuk kebutuhan harian.',
    image_url: seedUrl('banner-all-under-40'),
    link_url: '/collections/all-under-40',
    sort_order: 3,
    is_active: true,
    start_at: '2026-09-01T00:00:00Z',
    end_at: '2026-12-31T23:59:00Z',
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  },
];

/* ── In-memory store ─────────────────────────────────────────────────────── */

interface MockDb {
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  collections: Collection[];
  products: Product[];
  banners: Banner[];
  /** Product N ── M Collection junction. */
  productCollections: ProductCollection[];
  admin: AdminUser;
}

function createDb(): MockDb {
  return {
    categories: CATEGORIES.map((category) => ({ ...category })),
    colors: COLORS.map((color) => ({ ...color })),
    sizes: SIZES.map((size) => ({ ...size })),
    collections: COLLECTIONS.map((collection) => ({ ...collection })),
    products: PRODUCT_SEEDS.map(buildProduct),
    banners: BANNER_SEEDS.map((banner) => ({ ...banner })),
    productCollections: PRODUCT_SEEDS.flatMap((seed) =>
      seed.collectionIds.map((collectionId) => ({ product_id: seed.id, collection_id: collectionId }))
    ),
    admin: { ...ADMIN_USER },
  };
}

let store: MockDb | null = null;

export function getDb(): MockDb {
  if (!store) store = createDb();
  return store;
}

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/** Resolves the N──M collections for a product from the junction table. */
function withRelations(db: MockDb, product: Product): Product {
  const collections = db.productCollections
    .filter((link) => link.product_id === product.id)
    .map((link) => db.collections.find((collection) => collection.id === link.collection_id))
    .filter((collection): collection is Collection => Boolean(collection));
  return { ...product, collections };
}

function replaceProduct(db: MockDb, product: Product): Product {
  db.products = db.products.map((item) => (item.id === product.id ? product : item));
  return withRelations(db, product);
}

function isWithinSchedule(banner: Banner, now: Date): boolean {
  if (banner.start_at && new Date(banner.start_at).getTime() > now.getTime()) return false;
  if (banner.end_at && new Date(banner.end_at).getTime() < now.getTime()) return false;
  return true;
}

/* ── Reference data ──────────────────────────────────────────────────────── */

export function listCategories(includeInactive = false): Category[] {
  return getDb()
    .categories.filter((category) => includeInactive || category.is_active)
    .map((category) => ({ ...category }));
}

export function getCategoryBySlug(slug: string): Category | null {
  return listCategories(true).find((category) => category.slug === slug) ?? null;
}

export function listCollections(includeInactive = false): Collection[] {
  return getDb()
    .collections.filter((collection) => includeInactive || collection.is_active)
    .map((collection) => ({ ...collection }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getCollectionBySlug(slug: string): Collection | null {
  return listCollections(true).find((collection) => collection.slug === slug) ?? null;
}

export function listColors(): Color[] {
  return getDb().colors.map((color) => ({ ...color }));
}

export function listSizes(): Size[] {
  return getDb().sizes.map((size) => ({ ...size })).sort((a, b) => a.sort_order - b.sort_order);
}

export function getAdminUser(): AdminUser {
  return { ...getDb().admin };
}

/* ── Product queries ─────────────────────────────────────────────────────── */

function resolveCategoryId(db: MockDb, query: ProductQuery): number | null {
  if (query.category_id) return query.category_id;
  if (query.category_slug) {
    return db.categories.find((category) => category.slug === query.category_slug)?.id ?? -1;
  }
  return null;
}

function resolveCollectionId(db: MockDb, query: ProductQuery): number | null {
  if (query.collection_id) return query.collection_id;
  if (query.collection_slug) {
    return db.collections.find((collection) => collection.slug === query.collection_slug)?.id ?? -1;
  }
  return null;
}

function matchesQuery(
  db: MockDb,
  product: Product,
  query: ProductQuery,
  categoryId: number | null,
  collectionId: number | null
): boolean {
  const search = query.search?.trim().toLowerCase();
  if (search) {
    const haystack = [
      product.name,
      product.description,
      product.slug,
      ...product.variants.map((variant) => variant.sku),
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (categoryId !== null && product.category_id !== categoryId) return false;
  if (query.status && product.status !== query.status) return false;
  if (
    collectionId !== null &&
    !db.productCollections.some(
      (link) => link.product_id === product.id && link.collection_id === collectionId
    )
  ) {
    return false;
  }
  return true;
}

function sortProducts(items: Product[], sort: ProductSort | undefined): Product[] {
  const sorted = [...items];
  switch (sort) {
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted.sort((a, b) => b.id - a.id);
  }
}

/**
 * Server-side equivalent of `GET /api/products` (scope `public`, discontinued
 * products hidden) and `GET /api/admin/products` (scope `admin`, everything).
 */
export function listProducts(
  query: ProductQuery = {},
  scope: 'public' | 'admin' = 'public'
): Paginated<Product> {
  const db = getDb();
  const page = Math.max(query.page ?? 1, 1);
  const perPage = Math.min(Math.max(query.per_page ?? 12, 1), 100);
  const categoryId = resolveCategoryId(db, query);
  const collectionId = resolveCollectionId(db, query);

  const filtered = db.products
    .map((product) => withRelations(db, product))
    .filter((product) => (scope === 'admin' ? true : product.status !== 'discontinued'))
    .filter((product) => matchesQuery(db, product, query, categoryId, collectionId));

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;

  if (total === 0) return emptyPage<Product>(perPage);

  return {
    data: sortProducts(filtered, query.sort).slice(start, start + perPage),
    meta: { page, per_page: perPage, total, total_pages: totalPages },
  };
}

export function getProductBySlug(slug: string, scope: 'public' | 'admin' = 'public'): Product | null {
  const db = getDb();
  const product = db.products.find((item) => item.slug === slug);
  if (!product) return null;
  if (scope === 'public' && product.status === 'discontinued') return null;
  return withRelations(db, product);
}

export function getProductById(id: number): Product | null {
  const db = getDb();
  const product = db.products.find((item) => item.id === id);
  return product ? withRelations(db, product) : null;
}

/* ── Banners (Main Board) ────────────────────────────────────────────────── */

/** Public listing: active banners inside their scheduling window, by sort order. */
export function listActiveBanners(): Banner[] {
  const now = new Date();
  return getDb()
    .banners.filter((banner) => banner.is_active && isWithinSchedule(banner, now))
    .map((banner) => ({ ...banner }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function listAllBanners(): Banner[] {
  return getDb()
    .banners.map((banner) => ({ ...banner }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function createBanner(input: BannerInput): Banner {
  const db = getDb();
  const timestamp = new Date().toISOString();
  const banner: Banner = {
    id: nextId(db.banners),
    ...input,
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.banners = [...db.banners, banner];
  return { ...banner };
}

export function updateBanner(id: number, input: Partial<BannerInput>): Banner | null {
  const db = getDb();
  const existing = db.banners.find((banner) => banner.id === id);
  if (!existing) return null;
  const updated: Banner = { ...existing, ...input, id, updated_at: new Date().toISOString() };
  db.banners = db.banners.map((banner) => (banner.id === id ? updated : banner));
  return { ...updated };
}

export function deleteBanner(id: number): boolean {
  const db = getDb();
  const count = db.banners.length;
  db.banners = db.banners.filter((banner) => banner.id !== id);
  return db.banners.length < count;
}

/* ── Collections ─────────────────────────────────────────────────────────── */

export function createCollection(input: CollectionInput): Collection {
  const db = getDb();
  const timestamp = new Date().toISOString();
  const collection: Collection = {
    id: nextId(db.collections),
    ...input,
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.collections = [...db.collections, collection];
  return { ...collection };
}

export function updateCollection(id: number, input: CollectionInput): Collection | null {
  const db = getDb();
  const existing = db.collections.find((collection) => collection.id === id);
  if (!existing) return null;
  const updated: Collection = { ...existing, ...input, id, updated_at: new Date().toISOString() };
  db.collections = db.collections.map((collection) => (collection.id === id ? updated : collection));
  return { ...updated };
}

export function deleteCollection(id: number): boolean {
  const db = getDb();
  const count = db.collections.length;
  db.collections = db.collections.filter((collection) => collection.id !== id);
  db.productCollections = db.productCollections.filter((link) => link.collection_id !== id);
  return db.collections.length < count;
}

/* ── Product mutations ───────────────────────────────────────────────────── */

function applyProductInput(productId: number, input: ProductInput): Product {
  const images: ProductImage[] = input.images.map((image, index) => ({
    id: image.id ?? productId * 10 + index + 1,
    product_id: productId,
    image_url: image.image_url,
    alt_text: image.alt_text,
    sort_order: image.sort_order,
    is_primary: image.is_primary,
    created_at: CREATED_AT,
  }));

  const variants: ProductVariant[] = input.variants.map((variant, index) => {
    const color = findColor(variant.color_id);
    const size = findSize(variant.size_id);
    return {
      id: variant.id ?? productId * 100 + index + 1,
      product_id: productId,
      color_id: color.id,
      size_id: size.id,
      sku: variant.sku,
      stock: variant.stock,
      price: variant.price,
      is_active: variant.is_active,
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      color,
      size,
    };
  });

  return {
    id: productId,
    category_id: input.category_id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    material: input.material,
    care_instruction: input.care_instruction,
    status: input.status,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
    category: CATEGORIES.find((category) => category.id === input.category_id) ?? null,
    images,
    variants,
    collections: [],
  };
}

function syncCollections(db: MockDb, productId: number, collectionIds: number[]): void {
  db.productCollections = [
    ...db.productCollections.filter((link) => link.product_id !== productId),
    ...collectionIds.map((collectionId) => ({ product_id: productId, collection_id: collectionId })),
  ];
}

export function createProduct(input: ProductInput): Product {
  const db = getDb();
  const id = nextId(db.products);
  const product = applyProductInput(id, input);
  db.products = [...db.products, product];
  syncCollections(db, id, input.collection_ids);
  return withRelations(db, product);
}

export function updateProduct(id: number, input: ProductInput): Product | null {
  const db = getDb();
  const existing = db.products.find((product) => product.id === id);
  if (!existing) return null;

  const updated: Product = {
    ...applyProductInput(id, input),
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
  };
  replaceProduct(db, updated);
  syncCollections(db, id, input.collection_ids);
  return withRelations(db, updated);
}

export function deleteProduct(id: number): boolean {
  const db = getDb();
  const count = db.products.length;
  db.products = db.products.filter((product) => product.id !== id);
  db.productCollections = db.productCollections.filter((link) => link.product_id !== id);
  return db.products.length < count;
}

/* ── Dashboard statistics ────────────────────────────────────────────────── */

/**
 * Same aggregation the backend will expose as `GET /api/admin/stats`:
 * bucket counts + overall stock, all derived from products and active variants.
 */
export function productStats(): ProductStats {
  const db = getDb();
  const stats: ProductStats = {
    total: 0,
    ready: 0,
    not_ready: 0,
    discontinued: 0,
    empty: 0,
    active_products: 0,
    total_stock: 0,
  };

  for (const raw of db.products) {
    const product = withRelations(db, raw);
    stats.total += 1;
    stats[productBucket(product)] += 1;
    if (product.status !== 'discontinued') stats.active_products += 1;
    stats.total_stock += totalStock(product);
  }

  return stats;
}
