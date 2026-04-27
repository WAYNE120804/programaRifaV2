import { FormEvent, useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { todayISO } from '../../utils/dates';
import { formatCOP, formatCOPNumber } from '../../utils/money';

const startOfMonthISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const formatFullDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const label = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
};

const StatCard = ({ label, value, detail = '' }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
  </div>
);

const Section = ({ title, description = '', children }) => (
  <section className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
    {children}
  </section>
);

const HorizontalBars = ({ items, labelKey, valueKey, valueFormatter = formatCOP }) => {
  const maxValue = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 0);

  if (!items.length || maxValue <= 0) {
    return <EmptyState title="Sin datos" description="No hay registros para graficar en este periodo." />;
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0);
        const width = Math.max((value / maxValue) * 100, 4);

        return (
          <div key={`${item[labelKey]}-${value}`} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item[labelKey]}</span>
              <span className="shrink-0 font-semibold text-slate-900">{valueFormatter(value)}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div className="h-3 rounded-full bg-indigo-600" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const UtilityChart = ({ items }) => {
  const maxValue = Math.max(
    ...items.flatMap((item) => [Number(item.costo || 0), Number(item.ventas || 0), Number(item.utilidad || 0)]),
    0
  );

  if (!items.length || maxValue <= 0) {
    return <EmptyState title="Sin utilidades" description="No hay productos vendidos para calcular utilidad." />;
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {items.map((item) => (
        <div key={item.producto} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{item.producto}</p>
              <p className="text-xs text-slate-500">{item.categoria}</p>
            </div>
            <p className="text-sm font-semibold text-emerald-700">{formatCOP(item.utilidad)} utilidad</p>
          </div>
          {[
            { label: 'Costo', value: Number(item.costo || 0), className: 'bg-slate-500' },
            { label: 'Vendido', value: Number(item.ventas || 0), className: 'bg-indigo-600' },
            { label: 'Quedo', value: Number(item.utilidad || 0), className: 'bg-emerald-600' },
          ].map((bar) => (
            <div key={bar.label} className="grid grid-cols-[72px_1fr_96px] items-center gap-3 text-xs">
              <span className="font-medium text-slate-600">{bar.label}</span>
              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${bar.className}`}
                  style={{ width: `${Math.max((bar.value / maxValue) * 100, 3)}%` }}
                />
              </div>
              <span className="text-right font-semibold text-slate-800">{formatCOP(bar.value)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const InformesPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [filters, setFilters] = useState({
    desde: startOfMonthISO(),
    hasta: todayISO(),
  });

  const loadInformes = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const { data: response } = await client.get(endpoints.informes(), {
        params: nextFilters,
      });
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los informes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInformes();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadInformes(filters);
  };

  const categorias = useMemo(() => {
    const names = new Set<string>();

    for (const item of data?.ranking?.productos || []) {
      if (item.categoria) names.add(item.categoria);
    }

    for (const item of data?.utilidad?.productos || []) {
      if (item.categoria) names.add(item.categoria);
    }

    return [...names].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const rankingProductos = useMemo(() => {
    const productos = data?.ranking?.productos || [];

    return categoryFilter === 'TODAS'
      ? productos
      : productos.filter((item) => item.categoria === categoryFilter);
  }, [categoryFilter, data]);

  const utilidadProductos = useMemo(() => {
    const productos = data?.utilidad?.productos || [];

    return categoryFilter === 'TODAS'
      ? productos
      : productos.filter((item) => item.categoria === categoryFilter);
  }, [categoryFilter, data]);

  const cajaDiaria = data?.caja?.diaria?.[0] || null;
  const cajaGeneral = data?.caja?.general || null;
  const fondos = data?.fondos || [];
  const totalFondos = fondos.reduce((sum, fondo) => sum + Number(fondo.acumulado || 0), 0);
  const topProducto = rankingProductos[0] || null;
  const topUtilidad = utilidadProductos[0] || null;

  const utilidadColumns = useMemo(
    () => [
      { key: 'producto', header: 'Producto' },
      { key: 'categoria', header: 'Categoria' },
      { key: 'unidades', header: 'Unidades', render: (row) => formatCOPNumber(row.unidades) },
      { key: 'costo', header: 'Cuanto vale', render: (row) => formatCOP(row.costo) },
      { key: 'ventas', header: 'En cuanto se vendio', render: (row) => formatCOP(row.ventas) },
      { key: 'utilidad', header: 'Cuanto quedo', render: (row) => formatCOP(row.utilidad) },
    ],
    []
  );

  return (
    <div>
      <Topbar title="Informes" />
      <div className="space-y-6 px-6 py-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Desde
            <input
              type="date"
              value={filters.desde}
              onChange={(event) => setFilters((current) => ({ ...current, desde: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Hasta
            <input
              type="date"
              value={filters.hasta}
              onChange={(event) => setFilters((current) => ({ ...current, hasta: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Consultar
          </button>
          <p className="text-sm text-slate-500">
            {formatFullDate(filters.desde)} hasta {formatFullDate(filters.hasta)}
          </p>
        </form>

        <ErrorBanner message={error} />

        {loading ? (
          <Loading label="Cargando informes..." />
        ) : data ? (
          <>
            <Section title="Caja">
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard
                  label="Caja diaria"
                  value={formatCOP(cajaDiaria?.saldoActual || 0)}
                  detail={cajaDiaria ? `${cajaDiaria.nombre} - ${formatFullDate(cajaDiaria.fecha)}` : 'Sin caja diaria en el periodo'}
                />
                <StatCard
                  label="Caja general"
                  value={formatCOP(cajaGeneral?.saldoActual || 0)}
                  detail={`${formatCOP(cajaGeneral?.ingresos || 0)} entradas / ${formatCOP(cajaGeneral?.egresos || 0)} salidas`}
                />
              </div>
            </Section>

            <Section title="Fondos">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total en fondos" value={formatCOP(totalFondos)} detail={`${fondos.length} fondos/metas`} />
                {fondos.slice(0, 3).map((fondo) => (
                  <StatCard
                    key={fondo.id}
                    label={fondo.nombre}
                    value={formatCOP(fondo.acumulado)}
                    detail={`Meta ${formatCOP(fondo.metaTotal)} - ${fondo.avance}%`}
                  />
                ))}
              </div>
            </Section>

            <Section title="En que se esta gastando mas dinero">
              <HorizontalBars
                items={(data.gastos?.categorias || []).slice(0, 8)}
                labelKey="categoria"
                valueKey="total"
              />
            </Section>

            <Section title="Producto mas vendido" description="Filtra por categoria o deja todas las categorias.">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  Categoria
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2"
                  >
                    <option value="TODAS">Todas las categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </label>
                {topProducto ? (
                  <StatCard
                    label="Mas vendido"
                    value={topProducto.producto}
                    detail={`${formatCOPNumber(topProducto.unidades)} unidades - ${formatCOP(topProducto.ventas)}`}
                  />
                ) : null}
              </div>
              <HorizontalBars
                items={rankingProductos.slice(0, 10)}
                labelKey="producto"
                valueKey="unidades"
                valueFormatter={formatCOPNumber}
              />
            </Section>

            <Section title="Utilidades por producto" description="Cuanto vale, en cuanto se vendio y cuanto quedo.">
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Costo total" value={formatCOP(utilidadProductos.reduce((sum, item) => sum + Number(item.costo || 0), 0))} />
                <StatCard label="Vendido total" value={formatCOP(utilidadProductos.reduce((sum, item) => sum + Number(item.ventas || 0), 0))} />
                <StatCard label="Utilidad total" value={formatCOP(utilidadProductos.reduce((sum, item) => sum + Number(item.utilidad || 0), 0))} />
              </div>
              {topUtilidad ? (
                <StatCard
                  label="Producto con mayor utilidad"
                  value={topUtilidad.producto}
                  detail={`${formatCOP(topUtilidad.costo)} costo / ${formatCOP(topUtilidad.ventas)} vendido / ${formatCOP(topUtilidad.utilidad)} quedo`}
                />
              ) : null}
              <UtilityChart items={utilidadProductos.slice(0, 8)} />
              {(utilidadProductos || []).length === 0 ? (
                <EmptyState title="Sin utilidades" description="No hay ventas para la categoria seleccionada." />
              ) : (
                <DataTable columns={utilidadColumns} data={utilidadProductos} />
              )}
            </Section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default InformesPage;
