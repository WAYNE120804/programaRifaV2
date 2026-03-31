import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../api/client';
import { endpoints } from '../api/endpoints';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import Loading from '../components/common/Loading';
import Topbar from '../components/Layout/Topbar';
import { formatDateTime } from '../utils/dates';
import { formatCOP } from '../utils/money';

function toNumber(value: unknown) {
  return Number(value || 0);
}

function percentage(value: number, total: number) {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / total) * 100));
}

const chartColors = ['#2563eb', '#059669', '#ea580c', '#7c3aed', '#dc2626', '#0891b2'];

const SummaryCard = ({
  label,
  value,
  helper,
  tone = 'default',
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'success' | 'danger' | 'warning';
}) => {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'danger'
        ? 'text-rose-700'
        : tone === 'warning'
          ? 'text-amber-700'
          : 'theme-summary-value';

  return (
    <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
      <p className="theme-summary-label">{label}</p>
      <p className={`mt-3 text-4xl font-semibold ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
};

const HorizontalBarList = ({
  title,
  subtitle,
  items,
  color = '#2563eb',
  formatAsMoney = true,
  collapsible = false,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; helper?: string; tone?: string }>;
  color?: string;
  formatAsMoney?: boolean;
  collapsible?: boolean;
}) => {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  const content = (
    <div className="mt-6 space-y-4">
      {items.length ? (
        items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-800">{item.label}</span>
              <span className={item.tone || 'text-slate-700'}>
                {formatAsMoney ? formatCOP(item.value) : item.value.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${percentage(item.value, maxValue)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            {item.helper ? <p className="text-xs text-slate-500">{item.helper}</p> : null}
          </div>
        ))
      ) : (
        <EmptyState
          title="Sin datos"
          description="Todavia no hay informacion suficiente para este grafico."
        />
      )}
    </div>
  );

  return (
    <section className="theme-section-card rounded-2xl p-6 shadow-sm">
      {collapsible ? (
        <details open className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="theme-main-title theme-content-title text-xl font-semibold">{title}</h3>
                <p className="theme-content-subtitle mt-2 text-sm">{subtitle}</p>
              </div>
              <span className="text-sm font-medium text-slate-500 transition-transform group-open:rotate-180">
                ▼
              </span>
            </div>
          </summary>
          {content}
        </details>
      ) : (
        <>
          <h3 className="theme-main-title theme-content-title text-xl font-semibold">{title}</h3>
          <p className="theme-content-subtitle mt-2 text-sm">{subtitle}</p>
          {content}
        </>
      )}
    </section>
  );
};

const SegmentedBar = ({
  title,
  subtitle,
  segments,
  formatAsMoney = true,
}: {
  title: string;
  subtitle: string;
  segments: Array<{ label: string; value: number; color: string }>;
  formatAsMoney?: boolean;
}) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section className="theme-section-card rounded-2xl p-6 shadow-sm">
      <h3 className="theme-main-title theme-content-title text-xl font-semibold">{title}</h3>
      <p className="theme-content-subtitle mt-2 text-sm">{subtitle}</p>
      <div className="mt-6 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-5 w-full">
          {segments.map((segment) => (
            <div
              key={segment.label}
              style={{
                width: `${percentage(segment.value, total)}%`,
                backgroundColor: segment.color,
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {segments.map((segment) => (
          <div key={segment.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {segment.label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatAsMoney ? formatCOP(segment.value) : segment.value.toLocaleString('es-CO')}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const SimpleTable = ({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle: string;
  columns: string[];
  rows: React.ReactNode[][];
}) => (
  <section className="theme-section-card rounded-2xl p-6 shadow-sm">
    <h3 className="theme-main-title theme-content-title text-xl font-semibold">{title}</h3>
    <p className="theme-content-subtitle mt-2 text-sm">{subtitle}</p>
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="theme-table-head">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const Dashboard = () => {
  const [state, setState] = useState({
    loading: true,
    error: null as string | null,
    rifas: [] as any[],
    activeRifa: null as any,
    cajaResumen: null as any,
    gastos: [] as any[],
    boletas: [] as any[],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: rifas } = await client.get(endpoints.rifas());
        const activeRifa = rifas.find((rifa: any) => rifa.estado === 'ACTIVA') || null;

        if (!activeRifa) {
          setState({
            loading: false,
            error: null,
            rifas,
            activeRifa: null,
            cajaResumen: null,
            gastos: [],
            boletas: [],
          });
          return;
        }

        const [cajaRes, gastosRes, boletasRes] = await Promise.all([
          client.get(endpoints.cajasResumen(), { params: { rifaId: activeRifa.id } }),
          client.get(endpoints.gastos(), { params: { rifaId: activeRifa.id } }),
          client.get(endpoints.boletas(), { params: { rifaId: activeRifa.id } }),
        ]);

        setState({
          loading: false,
          error: null,
          rifas,
          activeRifa,
          cajaResumen: cajaRes.data,
          gastos: gastosRes.data.filter((gasto: any) => !gasto.anuladoAt),
          boletas: boletasRes.data,
        });
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      }
    };

    void loadData();
  }, []);

  const gastoPorCategoria = useMemo(() => {
    const grouped = state.gastos.reduce((acc: Record<string, number>, gasto: any) => {
      acc[gasto.categoria] = (acc[gasto.categoria] || 0) + toNumber(gasto.valor);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value);
  }, [state.gastos]);

  const boletasPorEstado = useMemo(() => {
    const grouped = state.boletas.reduce((acc: Record<string, number>, boleta: any) => {
      acc[boleta.estado] = (acc[boleta.estado] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([label, value], index) => ({
      label,
      value,
      color: chartColors[index % chartColors.length],
    }));
  }, [state.boletas]);

  const vendedoresPorBoletas = useMemo(() => {
    const vendors = [...(state.cajaResumen?.vendedores || [])].sort(
      (left: any, right: any) => right.totalBoletas - left.totalBoletas
    );

    return vendors.map((vendor: any) => ({
      label: vendor.vendedor?.nombre || 'Sin vendedor',
      value: vendor.totalBoletas,
      helper: `${vendor.totalBoletas} boletas · ${formatCOP(vendor.dineroARecoger)} por recoger`,
    }));
  }, [state.cajaResumen]);

  const vendedoresPorRecaudo = useMemo(() => {
    const vendors = [...(state.cajaResumen?.vendedores || [])].sort(
      (left: any, right: any) => right.dineroRecogido - left.dineroRecogido
    );

    return vendors.map((vendor: any) => ({
      label: vendor.vendedor?.nombre || 'Sin vendedor',
      value: vendor.dineroRecogido,
      helper: `Faltante: ${formatCOP(vendor.faltante)}`,
      tone:
        vendor.faltante > 0
          ? 'text-rose-700'
          : vendor.faltante < 0
            ? 'text-amber-700'
            : 'text-emerald-700',
    }));
  }, [state.cajaResumen]);

  const subcajaRows = useMemo(
    () =>
      (state.cajaResumen?.subcajas || []).map((subCaja: any) => [
        subCaja.nombre,
        formatCOP(subCaja.saldo),
        formatCOP(subCaja.ingresosAbonos),
        formatCOP(subCaja.egresosGastos),
      ]),
    [state.cajaResumen]
  );

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="space-y-6 px-6 py-6">
        {state.loading ? <Loading label="Cargando dashboard de la rifa activa" /> : null}
        <ErrorBanner message={state.error} />

        {!state.loading && !state.activeRifa ? (
          <div className="theme-section-card rounded-2xl p-8 shadow-sm">
            <EmptyState
              title="No hay rifa activa"
              description="Activa una rifa para ver el dashboard analitico con recaudo, gastos, boletas y vendedores."
            />
            <div className="mt-6">
              <Link
                to="/rifas"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
              >
                Ir a rifas
              </Link>
            </div>
          </div>
        ) : null}

        {!state.loading && state.activeRifa && state.cajaResumen ? (
          <>
            <div className="theme-section-card rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                    {state.activeRifa.nombre}
                  </h3>
                  <p className="theme-content-subtitle mt-2 text-sm">
                    Esta es la rifa activa sobre la que se calcula todo el dashboard operativo.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <div className="font-medium text-slate-800">Precio por boleta</div>
                  <div>{formatCOP(state.activeRifa.precioBoleta)}</div>
                  <div className="mt-2 font-medium text-slate-800">Estado</div>
                  <div>{state.activeRifa.estado}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                label="Dinero a recoger"
                value={formatCOP(state.cajaResumen.metricas.dineroPorRecoger)}
                helper="Meta total de recaudo con boletas asignadas"
              />
              <SummaryCard
                label="Dinero recogido"
                value={formatCOP(state.cajaResumen.metricas.dineroRecogido)}
                helper="Abonos confirmados y vigentes"
                tone="success"
              />
              <SummaryCard
                label="Falta por recoger"
                value={formatCOP(state.cajaResumen.metricas.dineroFaltante)}
                helper="Pendiente de recaudo con vendedores"
                tone={state.cajaResumen.metricas.dineroFaltante > 0 ? 'danger' : 'success'}
              />
              <SummaryCard
                label="Gastos reales"
                value={formatCOP(state.cajaResumen.metricas.totalGastos)}
                helper="Gastos no anulados de la rifa"
                tone="warning"
              />
              <SummaryCard
                label="Caja general"
                value={formatCOP(state.cajaResumen.cajaGeneral.saldo)}
                helper={`Actualizado ${formatDateTime(new Date())}`}
                tone={state.cajaResumen.cajaGeneral.saldo < 0 ? 'danger' : 'default'}
              />
            </div>

            <SegmentedBar
              title="Panorama de recaudo"
              subtitle="Comparativo rapido entre lo ya cobrado, lo pendiente y el gasto ejecutado."
              segments={[
                {
                  label: 'Recogido',
                  value: state.cajaResumen.metricas.dineroRecogido,
                  color: '#059669',
                },
                {
                  label: 'Faltante',
                  value: Math.max(0, state.cajaResumen.metricas.dineroFaltante),
                  color: '#dc2626',
                },
                {
                  label: 'Gastos',
                  value: state.cajaResumen.metricas.totalGastos,
                  color: '#ea580c',
                },
              ]}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <HorizontalBarList
                title="Gastos por categoria"
                subtitle="Muestra donde se esta yendo el dinero de la rifa."
                items={gastoPorCategoria.map((item) => ({
                  label: item.label.replaceAll('_', ' '),
                  value: item.value,
                }))}
                color="#ea580c"
              />
              <HorizontalBarList
                title="Vendedores por boletas"
                subtitle="Ordenados desde el vendedor con mas boletas hasta el de menos. Puedes plegarlo si hay muchos vendedores."
                items={vendedoresPorBoletas}
                color="#2563eb"
                formatAsMoney={false}
                collapsible
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <HorizontalBarList
                title="Recaudo por vendedor"
                subtitle="Cuanto ha recogido cada vendedor hasta ahora. Puedes plegarlo si necesitas bajar mas rapido."
                items={vendedoresPorRecaudo}
                color="#059669"
                collapsible
              />
              <SegmentedBar
                title="Estados de boletas"
                subtitle="Distribucion de la numeracion segun el estado actual."
                segments={boletasPorEstado}
                formatAsMoney={false}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SimpleTable
                title="Subcajas"
                subtitle="Resumen rapido de ingresos y egresos por canal de recaudo."
                columns={['Subcaja', 'Saldo', 'Abonos', 'Gastos']}
                rows={subcajaRows}
              />
              <SimpleTable
                title="Estado por vendedor"
                subtitle="Vista resumida para saber quien debe, quien va al dia y quien tiene saldo a favor."
                columns={['Vendedor', 'Boletas', 'Recogido', 'Faltante', 'Estado']}
                rows={(state.cajaResumen.vendedores || []).map((vendor: any) => [
                  vendor.vendedor?.nombre || 'Sin vendedor',
                  String(vendor.totalBoletas),
                  formatCOP(vendor.dineroRecogido),
                  formatCOP(vendor.faltante),
                  <span
                    key={vendor.id}
                    className={
                      vendor.estadoCuenta === 'PENDIENTE'
                        ? 'font-semibold text-rose-700'
                        : vendor.estadoCuenta === 'SALDO_A_FAVOR'
                          ? 'font-semibold text-amber-700'
                          : 'font-semibold text-emerald-700'
                    }
                  >
                    {vendor.estadoCuenta === 'PENDIENTE'
                      ? 'DEBE'
                      : vendor.estadoCuenta === 'SALDO_A_FAVOR'
                        ? 'SALDO A FAVOR'
                        : 'AL DIA'}
                  </span>,
                ])}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
