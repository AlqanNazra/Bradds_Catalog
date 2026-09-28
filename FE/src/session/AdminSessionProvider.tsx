import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentAdmin, signInAdmin, signOutAdmin } from '../services/adminApi';
import { setAuthToken } from '../services/http';
import { toErrorMessage } from '../types/api';
import type { AdminUser } from '../types/catalog';
import {
  AdminSessionContext,
  type AdminSessionStatus,
  type AdminSessionValue,
} from './adminSession';

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AdminSessionStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  // Restores the session on boot (`GET /api/admin/me`, demo fallback while the
  // endpoint does not exist yet).
  useEffect(() => {
    let cancelled = false;

    fetchCurrentAdmin()
      .then((user) => {
        if (cancelled) return;
        setAdmin(user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setAdmin(null);
        setStatus('anonymous');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const session = await signInAdmin(email, password);
      setAuthToken(session.token);
      setAdmin(session.admin);
      setStatus('authenticated');
      return true;
    } catch (reason: unknown) {
      setError(toErrorMessage(reason, 'Gagal masuk. Periksa email dan password.'));
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutAdmin();
    } finally {
      setAuthToken(null);
      setAdmin(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<AdminSessionValue>(
    () => ({ admin, status, error, signIn, signOut }),
    [admin, status, error, signIn, signOut]
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}
