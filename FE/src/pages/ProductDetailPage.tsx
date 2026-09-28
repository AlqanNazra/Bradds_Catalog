import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StateBlock } from '../components/common/StateBlock';
import { ProductAccordion, type AccordionItem } from '../components/product/ProductAccordion';
import { ProductGallery } from '../components/product/ProductGallery';
import { ProductInfo } from '../components/product/ProductInfo';
import { useAsync } from '../hooks/useAsync';
import { fetchProductBySlug } from '../services/catalogApi';
import { isNotFound } from '../types/api';
import type { Product } from '../types/catalog';
import { defaultSelection, sortedImages } from '../utils/product';
import './ProductDetailPage.css';

/** A user-made selection, tied to the product it belongs to. */
interface Selection {
  productId: number;
  colorId: number | null;
  sizeId: number | null;
}

/**
 * `/products/:slug` — gallery + variant picker + detail accordion.
 * The selected `ProductVariant` stays in this page state so the CTA and the stock
 * indicator always agree on the same colour/size combination. The default (first
 * in-stock) combination is derived during render from the loaded product.
 */
export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const [notFound, setNotFound] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  const load = useCallback(async (): Promise<Product> => {
    try {
      const product = await fetchProductBySlug(slug);
      setNotFound(false);
      return product;
    } catch (reason: unknown) {
      if (isNotFound(reason)) setNotFound(true);
      throw reason;
    }
  }, [slug]);

  const { data: product, loading, error, reload } = useAsync(load, 'Produk tidak dapat dimuat.');

  const fallback = useMemo(() => (product ? defaultSelection(product) : null), [product]);
  const active = selection && product && selection.productId === product.id ? selection : null;

  const colorId = active ? active.colorId : (fallback?.colorId ?? null);
  const sizeId = active ? active.sizeId : (fallback?.sizeId ?? null);

  function changeColor(nextColorId: number) {
    if (!product) return;
    setSelection({ productId: product.id, colorId: nextColorId, sizeId });
  }

  function changeSize(nextSizeId: number) {
    if (!product) return;
    setSelection({ productId: product.id, colorId, sizeId: nextSizeId });
  }

  if (loading) {
    return (
      <div className="product-detail">
        <div className="product-detail__state">
          <StateBlock variant="loading" title="Memuat produk…" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="product-detail">
        <div className="product-detail__state">
          <StateBlock
            variant="empty"
            title="Produk tidak ditemukan"
            message={`Produk dengan slug "${slug}" tidak tersedia atau sudah tidak dipublikasikan.`}
          />
          <Link to="/products" className="btn btn--outline">
            Kembali ke katalog
          </Link>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail">
        <div className="product-detail__state">
          <StateBlock
            variant="error"
            title="Produk tidak dapat dimuat"
            message={error ?? undefined}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  const accordionItems: AccordionItem[] = [
    { id: 'detail', title: 'Detail Info', body: product.description || 'Belum ada deskripsi produk.' },
    { id: 'material', title: 'Material', body: product.material || 'Belum ada informasi material.' },
    {
      id: 'care',
      title: 'Care Instruction',
      body: product.care_instruction || 'Belum ada instruksi perawatan.',
    },
  ];

  return (
    <article className="product-detail">
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Beranda</Link>
        <span aria-hidden="true">/</span>
        <Link to="/products">Produk</Link>
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail__grid">
        <ProductGallery images={sortedImages(product)} productName={product.name} />

        <ProductInfo
          product={product}
          colorId={colorId}
          sizeId={sizeId}
          onColorChange={changeColor}
          onSizeChange={changeSize}
        />
      </div>

      <div className="product-detail__accordion">
        <ProductAccordion items={accordionItems} />
      </div>

      {product.collections.length > 0 && (
        <div className="product-detail__collections">
          <span className="product-detail__collections-label">Bagian dari koleksi:</span>
          {product.collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.slug}`}
              className="product-detail__collection"
            >
              {collection.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
