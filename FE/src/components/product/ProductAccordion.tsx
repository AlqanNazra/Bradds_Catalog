import { useState } from 'react';
import './ProductAccordion.css';

export interface AccordionItem {
  id: string;
  title: string;
  body: string;
}

interface ProductAccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
}

/**
 * Detail panels below the product info (mockup: Detail / Material / Care Instruction).
 * The mockup also shows a "Fitur" panel, but the domain model has no feature field, so
 * only panels backed by real data are rendered — add one here when the field exists.
 */
export function ProductAccordion({ items, defaultOpenId }: ProductAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? items[0]?.id ?? null);

  if (items.length === 0) return null;

  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <section key={item.id} className="accordion__item">
            <h3 className="accordion__heading">
              <button
                type="button"
                className="accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${item.id}`}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span className="accordion__title">{item.title}</span>
                <span className="accordion__icon" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>
            {isOpen && (
              <div className="accordion__panel" id={`accordion-panel-${item.id}`}>
                {item.body}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
