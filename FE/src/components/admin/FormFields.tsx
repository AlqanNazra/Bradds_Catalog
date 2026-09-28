import './FormFields.css';

/** Shared field primitives for the admin forms. */

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string | undefined;
  placeholder?: string;
  type?: 'text' | 'url' | 'number' | 'datetime-local';
  min?: number;
  /** Renders a "generate from name" button (slug fields). */
  onGenerate?: (() => string) | undefined;
  generateLabel?: string;
  required?: boolean;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  type = 'text',
  min,
  onGenerate,
  generateLabel = 'Otomatis',
  required = false,
}: TextFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <span className="field__input-row">
        <input
          id={id}
          className={`field__control${error ? ' field__control--invalid' : ''}`}
          type={type}
          value={value}
          min={min}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {onGenerate && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onChange(onGenerate())}
          >
            {generateLabel}
          </button>
        )}
      </span>
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="field__hint" id={`${id}-hint`}>
            {hint}
          </span>
        )
      )}
    </label>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string | undefined;
  rows?: number;
  required?: boolean;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  rows = 4,
  required = false,
}: TextAreaFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <textarea
        id={id}
        className={`field__control${error ? ' field__control--invalid' : ''}`}
        rows={rows}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </label>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
  disabled?: boolean;
}

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
}: SelectFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <select
        id={id}
        className={`field__control${error ? ' field__control--invalid' : ''}`}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </label>
  );
}

