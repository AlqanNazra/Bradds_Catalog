import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductForm } from '../../components/admin/ProductForm';
import { StateBlock } from '../../components/common/StateBlock';
import { useAsync } from '../../hooks/useAsync';
import {
  createProduct,
  fetchAdminProduct,
  fetchAdminReferenceData,
  updateProduct,
} from '../../services/adminApi';
import type { ProductInput } from '../../types/admin';
import { isNotFound, toErrorMessage } from '../../types/api';
import type { Product } from '../../types/catalog';
import { attachVariantRelations } from '../../utils/product';
import './AdminProductFormPage.css';

interface LoadedFormData {
  reference: Awaited<ReturnType<typeof fetchAdminReferenceData>>;
  product: Product | null;
}

/**
 * Shared page for `/admin/products/new` and `/admin/products/:id/edit`.
 * Without an `:id` param it is create mode; otherwise the product is loaded (and its
 * variant colour/size relations hydrated) before the form is rendered.
 */
export function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = id ? Number.parseInt(id, 10) : null;
  const isEdit = productId !== null && Number.isFinite(productId);

  const [missing, setMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<LoadedFormData> => {
    const reference = await fetchAdminReferenceData();
    if (!isEdit || productId === null) {
      return { reference, product: null };
    }
    try {
      const loaded = await fetchAdminProduct(productId);
      setMissing(false);
      return {
        reference,
        product: attachVariantRelations(loaded, reference.colors, reference.sizes),
      };
    } catch (reason: unknown) {
      if (isNotFound(reason)) {
        setMissing(true);
        return { reference, product: null };
      }
      throw reason;
    }
  }, [isEdit, productId]);

  const data = useAsync(load, 'Data produk tidak dapat dimuat.');

  const loadedProduct = data.data?.product ?? null;

  async function handleSubmit(input: ProductInput) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isEdit && productId !== null) {
        await updateProduct(productId, input);
      } else {
        await createProduct(input);
      }
      navigate('/admin/products');
    } catch (reason: unknown) {
      setSubmitError(toErrorMessage(reason, 'Gagal menyimpan produk.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (data.loading) {
    return (
      <div className="admin-page">
        <StateBlock variant="loading" title="Memuat data produk…" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="admin-page">
        <StateBlock
          variant="error"
          title="Data produk tidak dapat dimuat"
          message={data.error}
          onRetry={data.reload}
        />
      </div>
    );
  }

  if (missing) {
    return (
      <div className="admin-page">
        <StateBlock
          variant="empty"
          title="Produk tidak ditemukan"
          message={`Tidak ada produk dengan ID ${productId}.`}
        />
        <Link to="/admin/products" className="btn btn--outline">
          Kembali ke Data Produk
        </Link>
      </div>
    );
  }

  if (!data.data) return null;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-form-head">
          <Link to="/admin/products" className="admin-form-head__back">
            ← Data Produk
          </Link>
          <h1 className="admin-page__title">{isEdit ? 'Edit Produk' : 'Tambah Produk'}</h1>
        </div>
        {isEdit && loadedProduct && (
          <Link to={`/products/${loadedProduct.slug}`} className="btn btn--ghost btn--sm">
            Lihat di situs
          </Link>
        )}
      </header>

      <ProductForm
        product={isEdit ? loadedProduct : null}
        reference={data.data.reference}
        submitting={submitting}
        submitError={submitError}
        onCancel={() => navigate('/admin/products')}
        onSubmit={handleSubmit}
      />
    </div>
  );
}