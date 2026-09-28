import type { Size } from '../../types/catalog';
import './SizeSelector.css';

interface SizeSelectorProps {
  sizes: Size[];
  selectedId: number | null;
  /** `false` renders the option disabled (no active in-stock variant for that combo). */
  isAvailable: (sizeId: number) => boolean;
  onSelect: (sizeId: number) => void;
}

/** Size chips for the variant picker; sizes without stock are disabled. */
export function SizeSelector({ sizes, selectedId, isAvailable, onSelect }: SizeSelectorProps) {
  if (sizes.length === 0) return null;

  return (
    <div className="size-selector">
      <p className="size-selector__label">Ukuran</p>
      <ul className="size-selector__list">
        {sizes.map((size) => {
          const available = isAvailable(size.id);
          const isSelected = size.id === selectedId;

          return (
            <li key={size.id}>
              <button
                type="button"
                className={`size-selector__option${isSelected ? ' size-selector__option--active' : ''}`}
                disabled={!available}
                aria-pressed={isSelected}
                title={available ? size.name : `${size.name} — stok habis`}
                onClick={() => onSelect(size.id)}
              >
                {size.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
