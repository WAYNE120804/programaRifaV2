import { NavLink } from 'react-router-dom';
import { useAppConfig } from '../../context/AppConfigContext';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/rifas', label: 'Rifas' },
  { to: '/boletas', label: 'Boletas' },
  { to: '/juego', label: 'Juego' },
  { to: '/vendedores', label: 'Vendedores' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/devoluciones', label: 'Devoluciones' },
  { to: '/abonos', label: 'Abonos' },
  { to: '/gastos', label: 'Gastos' },
  { to: '/caja', label: 'Caja' },
  { to: '/configuracion', label: 'Configuracion' },
];

const Sidebar = () => {
  const { config } = useAppConfig();

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
        {navItems.map((item) => (
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
    </aside>
  );
};

export default Sidebar;
