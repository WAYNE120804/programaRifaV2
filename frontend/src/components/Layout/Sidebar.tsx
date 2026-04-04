import { NavLink } from 'react-router-dom';
import { useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', adminOnly: true },
  { to: '/rifas', label: 'Rifas' },
  { to: '/boletas', label: 'Boletas' },
  { to: '/juego', label: 'Juego' },
  { to: '/vendedores', label: 'Vendedores' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/devoluciones', label: 'Devoluciones' },
  { to: '/abonos', label: 'Abonos' },
  { to: '/gastos', label: 'Gastos', adminOnly: true },
  { to: '/caja', label: 'Caja', adminOnly: true },
  { to: '/usuarios', label: 'Usuarios', adminOnly: true },
  { to: '/configuracion', label: 'Configuracion', adminOnly: true },
  { to: '/configuracion-web', label: 'Configuracion pagina web', adminOnly: true },
];

const Sidebar = () => {
  const { config } = useAppConfig();
  const { user, logout } = useAuth();
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.rol === 'ADMIN');

  return (
    <aside className="theme-sidebar flex h-screen w-60 flex-col border-r border-slate-200 p-6">
      <div className="flex items-center gap-3">
        {config.logoDataUrl ? (
          <img
            src={config.logoDataUrl}
            alt={config.nombreCasaRifera}
            className="h-12 w-12 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {config.nombreCasaRifera.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="theme-main-title text-lg font-semibold text-slate-800">
            {config.nombreCasaRifera}
          </h1>
          <p className="text-xs text-slate-500">Administrador de rifas</p>
        </div>
      </div>
      <nav className="mt-6 flex flex-col gap-2 text-sm">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `theme-nav-label rounded-md px-3 py-2 transition-colors ${
                isActive ? 'theme-sidebar-link-active' : 'theme-sidebar-link'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
          <p className="font-semibold uppercase tracking-[0.08em] text-slate-500">Sesion</p>
          <p className="mt-2 font-semibold text-slate-900">{user?.nombre || 'Usuario'}</p>
          <p className="mt-1 break-all">{user?.email || ''}</p>
          <p className="mt-1 uppercase tracking-[0.08em] text-slate-500">{user?.rol || ''}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="theme-nav-label w-full rounded-md border border-slate-300 px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
