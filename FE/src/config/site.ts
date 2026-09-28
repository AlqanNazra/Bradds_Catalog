/**
 * Static site copy taken from the design mockup (brand, header/footer navigation and
 * the order channel). Catalog data (banners, categories, collections, products) always
 * comes from the API — only presentation copy lives here.
 */

export interface NavItem {
  label: string;
  to: string;
}

export interface FooterColumn {
  title: string;
  links: NavItem[];
}

/**
 * Header navigation, matching the mockup labels.
 *
 * ASSUMPTION: "Custom" is the custom-order entry point in the design. There is no
 * custom-order flow in the domain model yet, so it currently points at the catalog
 * listing; point it at the future flow (e.g. `/custom`) when that route exists.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Produk', to: '/products' },
  { label: 'Styling', to: '/collections' },
  { label: 'Custom', to: '/products' },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/products' },
      { label: 'Contact us', to: '/products' },
      { label: 'Support', to: '/products' },
      { label: 'Careers', to: '/products' },
    ],
  },
  {
    title: 'Quick Link',
    links: [
      { label: 'Share Location', to: '/products' },
      { label: 'Orders Tracking', to: '/products' },
      { label: 'Size Guide', to: '/products' },
      { label: 'FAQs', to: '/products' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & conditions', to: '/products' },
      { label: 'Privacy Policy', to: '/products' },
    ],
  },
];

export const SITE = {
  brand: 'BRADDS',
  tagline: 'Complete your style with awesome clothes from us.',
  /**
   * Order channel used by the "Order Now" CTA on the product page. When null the CTA
   * copies the selected variant details to the clipboard instead of opening a chat.
   */
  orderChannel: null as string | null,
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'TikTok', href: 'https://tiktok.com' },
    { label: 'YouTube', href: 'https://youtube.com' },
  ],
};
