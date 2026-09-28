import { createContext, useContext } from 'react';
import type { AdminUser } from '../types/catalog';

export type AdminSessionStatus = 'loading' | 'authenticated' | 'anonymous';

/**
 * Admin session contract consumed by `RequireAdmin`, `AdminLayout` and the login page.
 * The provider talks to `/api/admin/me` + `/api/admin/login` (with the demo fallback in
 * `adminApi.ts`); the token is attached by `services/http.ts`.
 */
export interface AdminSessionValue {
  admin: AdminUser | null;
  status: AdminSessionStatus;
  error: string | null;
  /** Returns false and sets `error` when the credentials are rejected. */
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function useAdminSession(): AdminSessionValue {
  const value = useContext(AdminSessionContext);
  if (!value) {
    throw new Error('useAdminSession harus dipakai di dalam <AdminSessionProvider>.');
  }
  return value;
}
