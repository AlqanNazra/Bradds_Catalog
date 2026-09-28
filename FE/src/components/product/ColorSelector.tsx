import type { Color } from '../../types/catalog';
import './ColorSelector.css';

interface ColorSelectorProps {
  colors: Color[];
  selectedId: number | null;
  onSelect: (colorId: number) => void;
}

/** Colour swatches for the variant picker (mockup: "Color: (Variabel)" + circles). */
export function ColorSelector({ colors, selectedId, onSelect }: ColorSelectorProps) {
  if (colors.length === 0) return null;

  const selected = colors.find((color) => color.id === selectedId) ?? null;

  return (
    <div className="color-selector">
      <p className="color-selector__label">
        Warna: <span className="color-selector__value">{selected?.name ?? 'Variabel'}</span>
      </p>
      <ul className="color-selector__list">
        {colors.map((color) => (
          <li key={color.id}>
            <button
              type="button"
              className={`color-selector__swatch${
                color.id === selectedId ? ' color-selector__swatch--active' : ''
              }`}
              style={{ backgroundColor: color.hex_code }}
              title={color.name}
              aria-label={`Warna ${color.name}`}
              aria-pressed={color.id === selectedId}
              onClick={() => onSelect(color.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
