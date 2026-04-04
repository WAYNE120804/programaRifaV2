import { useEffect, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
};

const roles = ['ADMIN', 'CAJERO', 'VENDEDOR'];

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'CAJERO',
  });

  const loadUsuarios = async () => {
    const { data } = await client.get(endpoints.usuarios());
    setUsuarios(data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadUsuarios();
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await client.post(endpoints.usuarios(), form);
      setForm({
        nombre: '',
        email: '',
        password: '',
        rol: 'CAJERO',
      });
      await loadUsuarios();
      setSuccess('Usuario creado correctamente.');
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (usuario: Usuario) => {
    setError(null);
    setSuccess(null);

    try {
      await client.patch(endpoints.usuarioActivo(usuario.id), {
        activo: !usuario.activo,
      });
      await loadUsuarios();
      setSuccess(
        !usuario.activo
          ? 'Usuario activado correctamente.'
          : 'Usuario desactivado correctamente.'
      );
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  return (
    <div>
      <Topbar title="Usuarios" />

      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
        {loading ? <Loading label="Cargando usuarios..." /> : null}

        {!loading ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Crear usuario
              </h3>
              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Nombre</span>
                  <input
                    value={form.nombre}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nombre: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                  <input
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    type="email"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Contrasena</span>
                  <input
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Rol</span>
                  <select
                    value={form.rol}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, rol: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  >
                    {roles.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Guardando...' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </section>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Usuarios registrados
              </h3>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse">
                  <thead className="theme-table-head">
                    <tr className="text-left text-sm">
                      <th className="px-4 py-3 font-semibold">NOMBRE</th>
                      <th className="px-4 py-3 font-semibold">EMAIL</th>
                      <th className="px-4 py-3 font-semibold">ROL</th>
                      <th className="px-4 py-3 font-semibold">ESTADO</th>
                      <th className="px-4 py-3 font-semibold">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-t border-slate-200 text-sm">
                        <td className="px-4 py-3 font-semibold text-slate-900">{usuario.nombre}</td>
                        <td className="px-4 py-3 text-slate-700">{usuario.email}</td>
                        <td className="px-4 py-3 text-slate-700">{usuario.rol}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              usuario.activo
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {usuario.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(usuario)}
                            className="text-sm font-semibold text-slate-700 underline"
                          >
                            {usuario.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default UsuariosPage;
