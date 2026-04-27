import Topbar from '../components/Layout/Topbar';

const Dashboard = () => {
  return (
    <div>
      <Topbar title="Resumen" />
      <div className="space-y-6 px-6 py-6">
        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Proyecto depurado
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            Se eliminó la lógica activa de rifas, boletas, canal público, Wompi, premios y cierres comerciales. El proyecto quedó reducido a una base administrativa para reconstruirlo como sistema de almacén.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
            <p className="theme-summary-label">Estado</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">Base limpia</p>
            <p className="mt-2 text-sm text-slate-500">Sin dominio heredado activo</p>
          </div>
          <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
            <p className="theme-summary-label">Frontend</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">Reducido</p>
            <p className="mt-2 text-sm text-slate-500">Solo resumen, usuarios y configuración</p>
          </div>
          <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
            <p className="theme-summary-label">Backend</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">Mínimo</p>
            <p className="mt-2 text-sm text-slate-500">Auth, salud y configuración base</p>
          </div>
          <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
            <p className="theme-summary-label">Siguiente fase</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">Inventario</p>
            <p className="mt-2 text-sm text-slate-500">Nuevo modelo y módulos del almacén</p>
          </div>
        </div>

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Orden de construcción
          </h3>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              '1. Rediseñar Prisma para categorías, productos, inventario, ventas, clientes, caja y gastos.',
              '2. Implementar inventario con categorías administrables y productos con costo, precio, stock y código de barras.',
              '3. Implementar ventas con tirilla y descarga automática del inventario.',
              '4. Implementar caja diaria, caja mayor, cierres y retiros.',
              '5. Implementar clientes con búsqueda dinámica por nombre o cédula.',
              '6. Implementar separados, créditos y salidas no vendidas.'
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
