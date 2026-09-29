import { useState } from 'react';
import type { ProductMedia } from '../../types/catalog';
import { SmartImage } from '../common/SmartImage';
import './ProductGallery.css';

interface ProductGalleryProps {
  images: ProductMedia[];
  productName: string;
}

/**
 * Product detail gallery: main image + thumbnail strip (mockup layout). The selected
 * image is resolved during render, so switching products automatically falls back to
 * the first image without an effect.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const active = images.find((image) => image.id === selectedId) ?? images[0];

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage">
        <SmartImage
          src={active?.file_url}
          alt={active?.alt_text || productName}
          eager
          placeholderLabel="Foto produk"
        />
      </div>

      {images.length > 1 && (
        <ul className="product-gallery__thumbs">
          {images.map((image) => (
            <li key={image.id}>
              <button
                type="button"
                className={`product-gallery__thumb${
                  image.id === active?.id ? ' product-gallery__thumb--active' : ''
                }`}
                aria-label={`Tampilkan gambar: ${image.alt_text || productName}`}
                aria-current={image.id === active?.id}
                onClick={() => setSelectedId(image.id)}
              >
                <SmartImage src={image.file_url} alt={image.alt_text || productName} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
