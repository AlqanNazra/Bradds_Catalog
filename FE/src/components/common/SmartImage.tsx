import { useState } from 'react';
import './SmartImage.css';

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Text shown when the image is missing or fails to load. */
  placeholderLabel?: string;
  /** Use for above-the-fold imagery (hero banners, product gallery). */
  eager?: boolean;
}

/**
 * Image with a graceful fallback: broken or empty `image_url` values render a styled
 * placeholder instead of a broken-image icon. The failure is tracked per `src` (instead
 * of an effect that resets state) so a new URL automatically gets another chance.
 */
export function SmartImage({
  src,
  alt,
  className,
  placeholderLabel = 'Gambar belum tersedia',
  eager = false,
}: SmartImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const classes = `smart-image ${className ?? ''}`.trim();

  if (!src || failedSrc === src) {
    return (
      <div className={`${classes} smart-image--empty`} role="img" aria-label={alt}>
        <span className="smart-image__label">{placeholderLabel}</span>
      </div>
    );
  }

  return (
    <img
      className={classes}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailedSrc(src)}
    />
  );
}
