import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminSession } from '../../session/adminSession';
import { StateBlock } from '../common/StateBlock';
import './RequireAdmin.css';

/**
 * Route guard for `/admin/*`. While the session is being restored it shows a loading
 * state; anonymous visitors are redirected to the login screen with the intended
 * destination in `location.state`.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status } = useAdminSession();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="admin-gate">
        <StateBlock variant="loading" title="Memeriksa sesi admin…" />
      </div>
    );
  }

  if (status === 'anonymous') {
    return (
      <Navigate to="/admin/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }

  return <>{children}</>;
}
