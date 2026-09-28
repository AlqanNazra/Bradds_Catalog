import type { Color, Size } from '../../types/catalog';
import type { ProductVariantInput } from '../../types/admin';
import type { VariantFormErrors } from '../../utils/validation';
import { formatRupiah } from '../../utils/format';
import './VariantEditor.css';

interface VariantEditorProps {
  variants: ProductVariantInput[];
  colors: Color[];
  sizes: Size[];
  onChange: (variants: ProductVariantInput[]) => void;
  errors?: (VariantFormErrors | null)[] | undefined;
  listError?: string;
}

const EMPTY_VARIANT: ProductVariantInput = {
  color_id: 0,
  size_id: 0,
  sku: '',
  stock: 0,
  price: 0,
  is_active: true,
};

/**
 * Variant rows = the real inventory model (color × size). Each row becomes one
 * `ProductVariant` on save; duplicate colour/size pairs and duplicate SKUs are blocked
 * by `validateProductForm`.
 */
export function VariantEditor({
  variants,
  colors,
  sizes,
  onChange,
  errors,
  listError,
}: VariantEditorProps) {
  function update(index: number, patch: Partial<ProductVariantInput>) {
    onChange(
      variants.map((variant, position) =>
        position === index ? { ...variant, ...patch } : variant
      )
    );
  }

  function remove(index: number) {
    onChange(variants.filter((_, position) => position !== index));
  }

  function add() {
    onChange([
      ...variants,
      { ...EMPTY_VARIANT, color_id: colors[0]?.id ?? 0, size_id: sizes[0]?.id ?? 0 },
    ]);
  }

  return (
    <div className="variant-editor">
      {listError && (
        <p className="field__error" role="alert">
          {listError}
        </p>
      )}

      {variants.length === 0 ? (
        <p className="variant-editor__empty">
          Belum ada varian. Tambahkan minimal satu kombinasi warna dan ukuran.
        </p>
      ) : (
        <ul className="variant-editor__list">
          {variants.map((variant, index) => {
            const rowErrors = errors?.[index] ?? null;
            const color = colors.find((item) => item.id === variant.color_id) ?? null;
            const messages = [
              rowErrors?.color_id,
              rowErrors?.size_id,
              rowErrors?.sku,
              rowErrors?.stock,
              rowErrors?.price,
            ].filter(Boolean);

            return (
              <li key={variant.id ?? `row-${index}`} className="variant-editor__row">
                <div className="variant-editor__row-head">
                  <span className="variant-editor__row-title">
                    Varian #{index + 1}
                    {color && (
                      <span
                        className="variant-editor__swatch"
                        style={{ backgroundColor: color.hex_code }}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => remove(index)}
                  >
                    Hapus
                  </button>
                </div>

                <div className="variant-editor__fields">
                  <label className="field">
                    <span className="field__label">Warna</span>
                    <select
                      className={`field__control${rowErrors?.color_id ? ' field__control--invalid' : ''}`}
                      value={variant.color_id}
                      onChange={(event) => update(index, { color_id: Number(event.target.value) })}
                    >
                      <option value={0}>Pilih warna</option>
                      {colors.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span className="field__label">Ukuran</span>
                    <select
                      className={`field__control${rowErrors?.size_id ? ' field__control--invalid' : ''}`}
                      value={variant.size_id}
                      onChange={(event) => update(index, { size_id: Number(event.target.value) })}
                    >
                      <option value={0}>Pilih ukuran</option>
                      {sizes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span className="field__label">SKU</span>
                    <input
                      className={`field__control${rowErrors?.sku ? ' field__control--invalid' : ''}`}
                      type="text"
                      value={variant.sku}
                      onChange={(event) => update(index, { sku: event.target.value })}
                    />
                  </label>

                  <label className="field">
                    <span className="field__label">Stok</span>
                    <input
                      className={`field__control${rowErrors?.stock ? ' field__control--invalid' : ''}`}
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(event) => update(index, { stock: Number(event.target.value) })}
                    />
                  </label>

                  <label className="field">
                    <span className="field__label">Harga varian</span>
                    <input
                      className={`field__control${rowErrors?.price ? ' field__control--invalid' : ''}`}
                      type="number"
                      min={0}
                      value={variant.price}
                      onChange={(event) => update(index, { price: Number(event.target.value) })}
                    />
                    <span className="field__hint">
                      {variant.price > 0 ? formatRupiah(variant.price) : '0 = mengikuti harga produk'}
                    </span>
                  </label>

                  <label className="variant-editor__toggle">
                    <input
                      type="checkbox"
                      checked={variant.is_active}
                      onChange={(event) => update(index, { is_active: event.target.checked })}
                    />
                    <span>Aktif</span>
                  </label>
                </div>

                {messages.length > 0 && <p className="field__error">{messages.join(' ')}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="btn btn--outline btn--sm" onClick={add}>
        + Tambah varian
      </button>
    </div>
  );
}
