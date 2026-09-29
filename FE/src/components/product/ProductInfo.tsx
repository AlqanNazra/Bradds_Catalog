import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../../config/site';
import type { Product } from '../../types/catalog';
import { formatRupiah } from '../../utils/format';
import {
  describeSelection,
  priceRange,
  PRODUCT_STATUS_LABELS,
  productStatusTone,
} from '../../utils/product';
import { StatusPill } from '../common/StatusPill';
import { ProductVariantSelector } from './ProductVariantSelector';
import './ProductInfo.css';

interface ProductInfoProps {
  product: Product;
  colorId: number | null;
  sizeId: number | null;
  onColorChange: (colorId: number) => void;
  onSizeChange: (sizeId: number) => void;
}

/**
 * Product detail summary: name, category, price, variant picker, stock and the red
 * "ORDER NOW" call to action.
 *
 * The mockup shows a star rating; the domain model has no rating/review data, so no
 * rating is rendered here (and no review feature is invented).
 */
export function ProductInfo({
  product,
  colorId,
  sizeId,
  onColorChange,
  onSizeChange,
}: ProductInfoProps) {
  const [orderNote, setOrderNote] = useState<string | null>(null);

  const range = priceRange(product);
  const availability = describeSelection(product, colorId, sizeId);
  const variantPrice = availability.variant?.price || product.price;
  const priceLabel =
    range.min === range.max
      ? formatRupiah(range.min)
      : `${formatRupiah(range.min)} – ${formatRupiah(range.max)}`;

  async function handleOrder() {
    if (!availability.variant) return;

    const summary = [
      product.name,
      availability.color ? `Warna ${availability.color.name}` : null,
      availability.size ? `Ukuran ${availability.size.name}` : null,
      `SKU ${availability.variant.sku}`,
      formatRupiah(variantPrice),
    ]
      .filter(Boolean)
      .join(' · ');

    if (SITE.orderChannel) {
      window.open(SITE.orderChannel, '_blank', 'noopener');
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      setOrderNote('Detail varian disalin ke clipboard — kirim ke admin untuk melanjutkan pemesanan.');
    } catch {
      setOrderNote(`Catat detail pemesanan: ${summary}`);
    }
  }

  return (
    <div className="product-info">
      <div className="product-info__meta">
        {product.category_id && (
          <Link to={`/categories/${product.category_id}`} className="product-info__category">
            {product.category_id}
          </Link>
        )}
        <StatusPill
          label={PRODUCT_STATUS_LABELS[product.status]}
          tone={productStatusTone(product.status)}
        />
      </div>

      <h1 className="product-info__title">{product.name}</h1>
      <p className="product-info__price">{priceLabel}</p>

      <ProductVariantSelector
        product={product}
        colorId={colorId}
        sizeId={sizeId}
        onColorChange={onColorChange}
        onSizeChange={onSizeChange}
      />

      <p className="product-info__stock">
        Stok:{' '}
        <strong>
          {availability.variant
            ? `${availability.variant.stock} pcs`
            : `${product.variants.filter((variant) => variant.is_active).reduce((sum, variant) => sum + variant.stock, 0)} pcs (total)`}
        </strong>
        {availability.variant && <span className="product-info__sku">SKU {availability.variant.sku}</span>}
      </p>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={handleOrder}
        disabled={!availability.inStock}
      >
        ORDER NOW
      </button>

      {orderNote && (
        <p className="product-info__note" role="status">
          {orderNote}
        </p>
      )}
    </div>
  );
}
