import type { ReactNode } from 'react';
import type { Product } from '../../types/catalog';
import { ProductCard } from './ProductCard';
import './ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  /** Rendered when there are no products to show. */
  emptyState?: ReactNode;
  /** Admin grids show stock totals + status chips. */
  showStock?: boolean;
  showStatus?: boolean;
}

export function ProductGrid({
  products,
  emptyState,
  showStock = false,
  showStatus = false,
}: ProductGridProps) {
  if (products.length === 0) return <>{emptyState ?? null}</>;

  return (
    <ul className="product-grid">
      {products.map((product) => (
        <li key={product.id} className="product-grid__item">
          <ProductCard product={product} showStock={showStock} showStatus={showStatus} />
        </li>
      ))}
    </ul>
  );
}
