import './Pagination.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

/** Page navigation shared by the public catalog and the admin product table. */
export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      <button
        type="button"
        className="btn btn--outline btn--sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Sebelumnya
      </button>
      <span className="pagination__status">
        Halaman <strong>{page}</strong> dari {totalPages} · {total} produk
      </span>
      <button
        type="button"
        className="btn btn--outline btn--sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Berikutnya
      </button>
    </nav>
  );
}
