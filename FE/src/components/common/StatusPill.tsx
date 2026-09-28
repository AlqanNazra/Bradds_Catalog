import type { StatusTone } from '../../utils/product';
import './StatusPill.css';

interface StatusPillProps {
  label: string;
  tone: StatusTone;
}

/** Small status chip used for product status in lists, tables and the dashboard. */
export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${tone}`}>
      <span className="status-pill__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
