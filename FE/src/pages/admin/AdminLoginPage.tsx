import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SITE } from '../../config/site';
import { useAdminSession } from '../../session/adminSession';
import './AdminLoginPage.css';

interface LocationState {
  from?: string;
}

/**
 * `/admin/login` — entry point of the admin area. The demo backend accepts any
 * non-empty email/password; `AuthProvider` stores the returned token.
 */
export function AdminLoginPage() {
  const { status, signIn, error } = useAdminSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState | null)?.from ?? '/admin';

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const ok = await signIn(email, password);
    setSubmitting(false);
    if (ok) navigate(from, { replace: true });
  }

  return (
    <div className="login">
      <div className="login__card">
        <Link to="/" className="login__brand">
          <span className="login__brand-mark" aria-hidden="true">
            B
          </span>
          <span className="login__brand-name">{SITE.brand}</span>
        </Link>

        <h1 className="login__title">Masuk panel admin</h1>
        <p className="login__subtitle">
          Kelola katalog, varian, dan banner hero dari satu tempat.
        </p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <label className="field" htmlFor="admin-email">
            <span className="field__label">Email</span>
            <input
              id="admin-email"
              className="field__control"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              placeholder="admin@bradds.id"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field" htmlFor="admin-password">
            <span className="field__label">Password</span>
            <input
              id="admin-password"
              className="field__control"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--admin btn--block" disabled={submitting}>
            {submitting ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="login__hint">
          Mode pengembangan: isi email dan password apa pun untuk masuk. Backend produksi akan
          memverifikasi kredensial dan mengirim token Bearer.
        </p>

        <Link to="/" className="login__back">
          ← Kembali ke situs
        </Link>
      </div>
    </div>
  );
}