import './StateBlock.css';

type StateVariant = 'loading' | 'error' | 'empty';

interface StateBlockProps {
  variant: StateVariant;
  title: string;
  message?: string;
  onRetry?: () => void;
  /** Rendered as a smaller inline block (e.g. inside the admin dashboard panels). */
  compact?: boolean;
}

/**
 * Single component for the three non-happy paths so every screen shows loading, error
 * and empty states consistently.
 */
export function StateBlock({ variant, title, message, onRetry, compact = false }: StateBlockProps) {
  return (
    <div
      className={`state-block state-block--${variant}${compact ? ' state-block--compact' : ''}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'loading' ? 'polite' : undefined}
    >
      {variant === 'loading' && <span className="state-block__spinner" aria-hidden="true" />}
      <p className="state-block__title">{title}</p>
      {message && <p className="state-block__message">{message}</p>}
      {onRetry && variant === 'error' && (
        <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}
