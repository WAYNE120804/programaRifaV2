import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import ErrorBanner from '../../components/common/ErrorBanner';
import { useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { config } = useAppConfig();
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      const nextPath = (location.state as { from?: string } | null)?.from || '/';
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Panel administrativo
          </p>
          <h1 className="mt-3 text-4xl font-semibold uppercase text-slate-900">
            {config.nombreCasaRifera}
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Accede con tu usuario para administrar rifas, vendedores, caja, gastos, abonos,
            premios y el futuro canal publico de venta.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Seguridad
              </p>
              <p className="mt-2 text-sm text-slate-700">
                El panel ya no queda abierto al publico. Todas las rutas administrativas requieren
                inicio de sesion.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Usuarios
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Los administradores pueden crear nuevos usuarios y desactivar accesos cuando sea
                necesario.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Iniciar sesion
          </p>
          <h2 className="mt-3 text-3xl font-semibold uppercase text-slate-900">
            Acceso al sistema
          </h2>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <ErrorBanner message={error} />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder="admin@rifas.local"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contrasena</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder="********"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Ingresando...' : 'Entrar al panel'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
