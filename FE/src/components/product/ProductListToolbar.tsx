import { useState, type FormEvent } from 'react';
import type { Category, ProductSort } from '../../types/catalog';
import { PRODUCT_SORT_LABELS, PRODUCT_SORTS } from '../../utils/product';
import './ProductListToolbar.css';

interface ProductListToolbarProps {
  /** Enables the keyword search field when provided. */
  search?: { value: string; onSubmit: (value: string) => void };
  /** Enables the category filter when provided. */
  categoryFilter?: {
    categories: Category[];
    value: string;
    onChange: (slug: string) => void;
  };
  sort: ProductSort;
  onSortChange: (sort: ProductSort) => void;
}

/** Search / category / sort controls for the catalog listing pages. */
export function ProductListToolbar({
  search,
  categoryFilter,
  sort,
  onSortChange,
}: ProductListToolbarProps) {
  const externalValue = search?.value ?? '';
  const [term, setTerm] = useState(externalValue);
  const [syncedValue, setSyncedValue] = useState(externalValue);

  // Adjusting state during render (the recommended alternative to a sync effect):
  // when the URL-driven search value changes (e.g. navbar search, back/forward),
  // the local input follows it.
  if (externalValue !== syncedValue) {
    setSyncedValue(externalValue);
    setTerm(externalValue);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search?.onSubmit(term.trim());
  }

  return (
    <div className="list-toolbar">
      {search && (
        <form className="list-toolbar__search" onSubmit={submit} role="search">
          <label className="sr-only" htmlFor="catalog-search">
            Cari produk
          </label>
          <input
            id="catalog-search"
            className="field__control"
            type="search"
            value={term}
            placeholder="Cari nama produk atau SKU…"
            onChange={(event) => setTerm(event.target.value)}
          />
          <button type="submit" className="btn btn--outline btn--sm">
            Cari
          </button>
        </form>
      )}

      {categoryFilter && (
        <label className="list-toolbar__control">
          <span className="field__label">Kategori</span>
          <select
            className="field__control"
            value={categoryFilter.value}
            onChange={(event) => categoryFilter.onChange(event.target.value)}
          >
            <option value="">Semua kategori</option>
            {categoryFilter.categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="list-toolbar__control">
        <span className="field__label">Urutkan</span>
        <select
          className="field__control"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ProductSort)}
        >
          {PRODUCT_SORTS.map((value) => (
            <option key={value} value={value}>
              {PRODUCT_SORT_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
