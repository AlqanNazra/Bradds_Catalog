import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/catalog';
import { formatNumber, formatRupiah } from '../../utils/format';
import {
  activeVariants,
  primaryImage,
  PRODUCT_STATUS_LABELS,
  productStatusTone,
  totalStock,
} from '../../utils/product';
import { SmartImage } from '../common/SmartImage';
import { StatusPill } from '../common/StatusPill';
import './ProductTable.css';

interface ProductTableProps {
  products: Product[];
  onDelete: (product: Product) => void;
  /** Product id currently being deleted (disables the row actions). */
  deletingId: number | null;
}

/**
 * Admin catalogue table. Deleting asks for an inline confirmation before the request is
 * sent, so a mis-click cannot remove a product.
 */
export function ProductTable({ products, onDelete, deletingId }: ProductTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Produk</th>
            <th scope="col">Kategori</th>
            <th scope="col" className="admin-table__col--md">Varian</th>
            <th scope="col" className="admin-table__col--md">Stok</th>
            <th scope="col">Status</th>
            <th scope="col" className="admin-table__col--actions">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const image = primaryImage(product);
            const variantCount = activeVariants(product).length;
            const busy = deletingId === product.id;

            return (
              <tr key={product.id}>
                <td>
                  <div className="admin-table__product">
                    <span className="admin-table__thumb">
                      <SmartImage src={image?.image_url} alt={image?.alt_text || product.name} />
                    </span>
                    <span className="admin-table__product-text">
                      <Link to={`/admin/products/${product.id}/edit`} className="admin-table__name">
                        {product.name}
                      </Link>
                      <span className="admin-table__slug">/{product.slug}</span>
                      <span className="admin-table__price">{formatRupiah(product.price)}</span>
                    </span>
                  </div>
                </td>
                <td>{product.category?.name ?? '—'}</td>
                <td className="admin-table__col--md">{variantCount}</td>
                <td className="admin-table__col--md">{formatNumber(totalStock(product))}</td>
                <td>
                  <StatusPill
                    label={PRODUCT_STATUS_LABELS[product.status]}
                    tone={productStatusTone(product.status)}
                  />
                </td>
                <td className="admin-table__col--actions">
                  <div className="admin-table__actions">
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className="btn btn--ghost btn--sm"
                    >
                      Edit
                    </Link>
                    {confirmId === product.id ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={busy}
                          onClick={() => {
                            onDelete(product);
                            setConfirmId(null);
                          }}
                        >
                          {busy ? 'Menghapus…' : 'Ya, hapus'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => setConfirmId(product.id)}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
