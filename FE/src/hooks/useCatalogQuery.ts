import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductQuery, ProductSort } from '../types/catalog';
import { parseProductSort } from '../utils/product';

export interface CatalogQueryControls {
  search: string;
  categorySlug: string;
  sort: ProductSort;
  page: number;
  /** Ready-to-use query object passed to `fetchProducts`. */
  query: ProductQuery;
  update: (changes: Record<string, string | null>) => void;
}

/**
 * Keeps the catalog listing state (search / category / sort / page) in the URL so the
 * listing is shareable, and turns it into the API query object. Categories and
 * collections can be pinned by the route (`/categories/:slug`, `/collections/:slug`).
 */
export function useCatalogQuery(
  perPage = 12,
  lockedCategorySlug: string | null = null,
  lockedCollectionSlug: string | null = null
): CatalogQueryControls {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const sort = parseProductSort(searchParams.get('sort'));
  const parsedPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const query = useMemo<ProductQuery>(
    () => ({
      search: search || undefined,
      category_slug: lockedCategorySlug ?? (categorySlug || undefined),
      collection_slug: lockedCollectionSlug ?? undefined,
      sort,
      page,
      per_page: perPage,
    }),
    [search, categorySlug, lockedCategorySlug, lockedCollectionSlug, sort, page, perPage]
  );

  return { search, categorySlug, sort, page, query, update };
}
