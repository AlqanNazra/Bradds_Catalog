import { useRef, useState, type FormEvent } from 'react';
import { uploadImage } from '../../services/adminApi';
import type { ProductImageInput } from '../../types/admin';
import { toErrorMessage } from '../../types/api';
import { SmartImage } from '../common/SmartImage';
import './ImageUploader.css';

interface ImageUploaderProps {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
  max?: number;
  error?: string;
}

/**
 * Multi-image manager: upload from disk (or paste a URL), reorder, pick the primary
 * image and remove entries. Only the uploaded URL is kept in state — never the binary.
 */
export function ImageUploader({ images, onChange, max = 8, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState('');

  /** Keeps `sort_order` contiguous and guarantees exactly one primary image. */
  function normalize(items: ProductImageInput[]): ProductImageInput[] {
    const hasPrimary = items.some((image) => image.is_primary);
    return items.map((image, index) => ({
      ...image,
      sort_order: index,
      is_primary: hasPrimary ? image.is_primary : index === 0,
    }));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const selected = Array.from(files).slice(0, Math.max(max - images.length, 0));
    if (selected.length === 0) {
      setUploadError(`Maksimal ${max} gambar per produk.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: ProductImageInput[] = [];
      for (const file of selected) {
        const { image_url } = await uploadImage(file);
        uploaded.push({ image_url, alt_text: file.name, sort_order: 0, is_primary: false });
      }
      onChange(normalize([...images, ...uploaded]));
    } catch (reason: unknown) {
      setUploadError(toErrorMessage(reason, 'Gagal mengunggah gambar.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function addFromUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = urlValue.trim();
    if (!value) return;
    const added: ProductImageInput = {
      image_url: value,
      alt_text: '',
      sort_order: 0,
      is_primary: false,
    };
    onChange(normalize([...images, added]));
    setUrlValue('');
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(normalize(next));
  }

  function setPrimary(index: number) {
    onChange(images.map((image, position) => ({ ...image, is_primary: position === index })));
  }

  function remove(index: number) {
    onChange(normalize(images.filter((_, position) => position !== index)));
  }

  function updateAlt(index: number, altText: string) {
    onChange(
      images.map((image, position) =>
        position === index ? { ...image, alt_text: altText } : image
      )
    );
  }

  return (
    <div className="image-uploader">
      <div className="image-uploader__toolbar">
        <label className="btn btn--admin btn--sm">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
          {uploading ? 'Mengunggah…' : 'Unggah gambar'}
        </label>

        <form className="image-uploader__url" onSubmit={addFromUrl}>
          <label className="sr-only" htmlFor="image-url">
            Tambah gambar dari URL
          </label>
          <input
            id="image-url"
            className="field__control"
            type="url"
            value={urlValue}
            placeholder="https://… atau /uploads/gambar.jpg"
            onChange={(event) => setUrlValue(event.target.value)}
          />
          <button type="submit" className="btn btn--outline btn--sm">
            Tambah URL
          </button>
        </form>
      </div>

      <p className="field__hint">
        {images.length} dari maksimal {max} gambar. Gambar pertama menjadi gambar utama.
      </p>

      {(error || uploadError) && (
        <p className="field__error" role="alert">
          {uploadError ?? error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="image-uploader__empty">
          Belum ada gambar. Unggah minimal satu gambar produk.
        </p>
      ) : (
        <ul className="image-uploader__grid">
          {images.map((image, index) => (
            <li key={`${image.id ?? 'new'}-${index}`} className="image-uploader__item">
              <span className="image-uploader__thumb">
                <SmartImage src={image.image_url} alt={image.alt_text || `Gambar ${index + 1}`} />
                {image.is_primary && <span className="image-uploader__primary">Utama</span>}
              </span>

              <label className="image-uploader__alt">
                <span className="sr-only">Teks alternatif gambar {index + 1}</span>
                <input
                  className="field__control"
                  type="text"
                  value={image.alt_text}
                  placeholder="Alt text"
                  onChange={(event) => updateAlt(index, event.target.value)}
                />
              </label>

              <div className="image-uploader__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Geser gambar ${index + 1} ke atas`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label={`Geser gambar ${index + 1} ke bawah`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setPrimary(index)}
                  disabled={image.is_primary}
                >
                  Utama
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => remove(index)}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
