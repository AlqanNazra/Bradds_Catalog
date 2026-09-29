import { Link } from 'react-router-dom';
import type { Product } from '../../types/catalog';
import { formatRupiah } from '../../utils/format';
import {
  bucketTone,
  primaryImage,
  productBucket,
  PRODUCT_BUCKET_LABELS,
  priceRange,
  totalStock,
} from '../../utils/product';
import { SmartImage } from '../common/SmartImage';
import { StatusPill } from '../common/StatusPill';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  /** Extra detail line (used on the admin catalogue pages). */
  showStock?: boolean;
  /** Renders the admin-style status chip instead of the "Stok habis" badge. */
  showStatus?: boolean;
}

export function ProductCard({ product, showStock = false, showStatus = false }: ProductCardProps) {
  const image = primaryImage(product);
  const range = priceRange(product);
  const stock = totalStock(product);
  const bucket = productBucket(product);
  const priceLabel =
    range.min === range.max
      ? formatRupiah(range.min)
      : `${formatRupiah(range.min)} – ${formatRupiah(range.max)}`;

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card__media">
        <SmartImage
          src={image?.file_url}
          alt={image?.alt_text || product.name}
          placeholderLabel="Foto produk"
        />
        {bucket === 'empty' && <span className="product-card__badge">Stok habis</span>}
      </Link>

      <div className="product-card__body">
        <p className="product-card__category">{product.category_id ?? 'Tanpa kategori'}</p>
        <h3 className="product-card__title">
          <Link to={`/products/${product.slug}`} className="product-card__title-link">
            {product.name}
          </Link>
        </h3>
        <p className="product-card__price">{priceLabel}</p>

        {(showStock || showStatus) && (
          <div className="product-card__meta">
            {showStatus && (
              <StatusPill label={PRODUCT_BUCKET_LABELS[bucket]} tone={bucketTone(bucket)} />
            )}
            {showStock && <span className="product-card__stock">{stock} pcs</span>}
          </div>
        )}
      </div>
    </article>
  );
}
