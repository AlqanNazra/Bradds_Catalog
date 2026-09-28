import type { Product } from '../../types/catalog';
import { availableColors, availableSizes, describeSelection, isSizeAvailable } from '../../utils/product';
import { ColorSelector } from './ColorSelector';
import { SizeSelector } from './SizeSelector';
import './ProductVariantSelector.css';

interface ProductVariantSelectorProps {
  product: Product;
  colorId: number | null;
  sizeId: number | null;
  onColorChange: (colorId: number) => void;
  onSizeChange: (sizeId: number) => void;
}

/**
 * Colour + size picker driving the selected `ProductVariant`. Only combinations that
 * exist as an active, in-stock variant are selectable — the availability copy comes
 * from `describeSelection`.
 */
export function ProductVariantSelector({
  product,
  colorId,
  sizeId,
  onColorChange,
  onSizeChange,
}: ProductVariantSelectorProps) {
  const colors = availableColors(product);
  const sizes = availableSizes(product);

  if (colors.length === 0 && sizes.length === 0) {
    return (
      <p className="variant-selector__notice">
        Varian untuk produk ini belum tersedia. Hubungi admin untuk ketersediaan.
      </p>
    );
  }

  const availability = describeSelection(product, colorId, sizeId);

  return (
    <div className="variant-selector">
      <ColorSelector colors={colors} selectedId={colorId} onSelect={onColorChange} />

      <SizeSelector
        sizes={sizes}
        selectedId={sizeId}
        isAvailable={(size) => isSizeAvailable(product, colorId, size)}
        onSelect={onSizeChange}
      />

      <p
        className={`variant-selector__status${
          availability.inStock ? ' variant-selector__status--in-stock' : ''
        }`}
        role="status"
      >
        {availability.message}
      </p>
    </div>
  );
}
