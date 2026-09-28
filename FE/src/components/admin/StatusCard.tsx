import type { StatusTone } from '../../utils/product';
import './StatusCard.css';

interface StatusCardProps {
  label: string;
  value: number;
  tone: StatusTone;
  hint: string;
}

/** Dashboard counter card (mockup: Ready / Belum Siap / Tidak Dilanjut / Empty). */
export function StatusCard({ label, value, tone, hint }: StatusCardProps) {
  return (
    <article className={`status-card status-card--${tone}`}>
      <span className="status-card__icon" aria-hidden="true" />
      <div className="status-card__content">
        <p className="status-card__label">{label}</p>
        <p className="status-card__value">{value}</p>
        <p className="status-card__hint">{hint}</p>
      </div>
    </article>
  );
}
