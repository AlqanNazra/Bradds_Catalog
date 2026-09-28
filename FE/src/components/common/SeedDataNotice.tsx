import { useSyncExternalStore } from 'react';
import { isUsingSeedData, subscribeSeedData } from '../../services/http';
import './SeedDataNotice.css';

const getServerSnapshot = () => false;

/**
 * Shown while the catalog endpoints are unavailable: the UI then renders the local
 * seed data (`src/services/mockDb.ts`). Disappears automatically once the real API
 * responds, so no flag has to be flipped by hand.
 */
export function SeedDataNotice() {
  const usingSeedData = useSyncExternalStore(subscribeSeedData, isUsingSeedData, getServerSnapshot);

  if (!usingSeedData) return null;

  return (
    <p className="seed-notice" role="status">
      <strong>Mode demo.</strong> Endpoint katalog belum aktif, data yang tampil berasal dari seed lokal
      (<code>src/services/mockDb.ts</code>).
    </p>
  );
}
