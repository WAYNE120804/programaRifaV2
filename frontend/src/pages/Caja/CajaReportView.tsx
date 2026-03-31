import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatCOP } from '../../utils/money';
import { printCajaLetterReport } from '../../utils/print';
import { getGastoCategoryLabel } from '../Gastos/gastoCategories';

const CajaReportView = () => {
  const { config } = useAppConfig();
  const [searchParams] = useSearchParams();
  const rifaId = searchParams.get('rifaId') || '';
  const [summary, setSummary] = useState<any | null>(null);
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!rifaId) {
        setError('No se envio una rifa para generar el informe de caja.');
        setLoading(false);
        return;
      }

      try {
        const [summaryResponse, gastosResponse] = await Promise.all([
          client.get(endpoints.cajasResumen(), { params: { rifaId } }),
          client.get(endpoints.gastos()),
        ]);

        setSummary(summaryResponse.data);
        setGastos(
          (gastosResponse.data || []).filter(
            (item: any) => item.rifaId === rifaId && !item.anuladoAt
          )
        );
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [rifaId]);

  const gastosPorCategoria = useMemo(() => {
    const grouped = gastos.reduce<Record<string, number>>((acc, item) => {
      const key = item.categoria || 'OTROS';
      acc[key] = (acc[key] || 0) + Number(item.valor || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([categoria, total]) => ({
        categoria,
        label: getGastoCategoryLabel(categoria),
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [gastos]);

  const maxGastoCategoria = useMemo(
    () => Math.max(...gastosPorCategoria.map((item) => item.total), 1),
    [gastosPorCategoria]
  );

  const handlePrint = () => {
    if (!summary) {
      return;
    }

    printCajaLetterReport({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      responsableDireccion: config.responsableDireccion,
      responsableCiudad: config.responsableCiudad,
      responsableDepartamento: config.responsableDepartamento,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      reportTitle: 'Informe general de caja',
      rifaNombre: summary.rifa?.nombre || 'Sin rifa',
      summary,
      gastos: gastos.map((item) => ({
        categoria: item.categoria,
        valor: item.valor,
      })),
    });
  };

  return (
    <div>
      <Topbar
        title="Informe general de caja"
        actions={
          <>
            <Link
              to="/caja"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              VOLVER A CAJA
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!summary}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              IMPRIMIR INFORME
            </button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? <Loading label="Construyendo informe de caja..." /> : null}

        {!loading && !summary ? (
          <EmptyState
            title="Sin resumen disponible"
            description="No fue posible construir el informe de caja para esta rifa."
          />
        ) : null}

        {!loading && summary ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <div className="grid gap-6 xl:grid-cols-[120px_minmax(0,1fr)]">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-slate-200 bg-white p-3">
                  {config.logoDataUrl ? (
                    <img
                      src={config.logoDataUrl}
                      alt={config.nombreCasaRifera}
                      className="max-h-24 max-w-24 object-contain"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">
                      {config.nombreCasaRifera.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="theme-content-subtitle text-xs font-semibold uppercase tracking-[0.24em]">
                    Informe administrativo
                  </p>
                  <h2 className="theme-main-title theme-content-title mt-2 text-3xl font-semibold">
                    Informe general de caja
                  </h2>
                  <p className="theme-content-subtitle mt-2 text-sm">
                    Consolidado de ingresos, egresos, subcajas y estado de pago por vendedor.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">RIFA</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {summary.rifa?.nombre || 'SIN RIFA'}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">CAJA GENERAL</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {formatCOP(summary.cajaGeneral?.saldo || 0)}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">INGRESOS</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {formatCOP(summary.metricas?.totalIngresos || 0)}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">EGRESOS</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {formatCOP(summary.metricas?.totalGastos || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Estado financiero general
                </h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="theme-summary-card rounded-2xl p-4">
                    <p className="theme-summary-label">A RECOGER</p>
                    <p className="theme-summary-value mt-2 text-lg font-semibold">
                      {formatCOP(summary.metricas?.dineroPorRecoger || 0)}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-4">
                    <p className="theme-summary-label">RECOGIDO</p>
                    <p className="theme-summary-value mt-2 text-lg font-semibold">
                      {formatCOP(summary.metricas?.dineroRecogido || 0)}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-4">
                    <p className="theme-summary-label">FALTANTE</p>
                    <p className="theme-summary-value mt-2 text-lg font-semibold">
                      {formatCOP(summary.metricas?.dineroFaltante || 0)}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-4">
                    <p className="theme-summary-label">SUBCAJAS</p>
                    <p className="theme-summary-value mt-2 text-lg font-semibold">
                      {summary.subcajas?.length || 0}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-4">
                    <p className="theme-summary-label">VENDEDORES</p>
                    <p className="theme-summary-value mt-2 text-lg font-semibold">
                      {summary.vendedores?.length || 0}
                    </p>
                  </div>
                </div>
              </section>

              <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Gastos por categoria
                </h3>
                <div className="mt-6 space-y-4">
                  {gastosPorCategoria.length ? (
                    gastosPorCategoria.map((item) => {
                      const width = Math.max(6, Math.round((item.total / maxGastoCategoria) * 100));
                      return (
                        <div key={item.categoria} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_120px] md:items-center">
                          <div>
                            <p className="font-semibold text-slate-900">{item.label}</p>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-orange-400" style={{ width: `${width}%` }} />
                          </div>
                          <p className="text-right text-sm font-semibold text-slate-900">
                            {formatCOP(item.total)}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">No hay gastos registrados para esta rifa.</p>
                  )}
                </div>
              </section>
            </div>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Subcajas
              </h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summary.subcajas?.map((subCaja: any) => (
                  <div key={subCaja.id} className="theme-summary-card rounded-2xl p-5">
                    <p className="theme-summary-label">SUBCAJA</p>
                    <p className="theme-summary-value mt-2 text-2xl font-semibold">
                      {subCaja.nombre}
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Saldo</span>
                        <strong>{formatCOP(subCaja.saldo)}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Abonos</span>
                        <strong>{formatCOP(subCaja.ingresosAbonos)}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Gastos</span>
                        <strong>{formatCOP(subCaja.egresosGastos)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Estado por vendedor
              </h3>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left text-sm">
                      <th className="px-4 py-3 font-semibold">VENDEDOR</th>
                      <th className="px-4 py-3 font-semibold">BOLETAS</th>
                      <th className="px-4 py-3 text-right font-semibold">A RECOGER</th>
                      <th className="px-4 py-3 text-right font-semibold">RECOGIDO</th>
                      <th className="px-4 py-3 text-right font-semibold">FALTANTE</th>
                      <th className="px-4 py-3 font-semibold">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.vendedores?.map((item: any) => {
                      const isPending = item.estadoCuenta === 'PENDIENTE';
                      const isFavor = item.estadoCuenta === 'SALDO_A_FAVOR';
                      const rowClass = isPending
                        ? 'bg-rose-50 text-rose-700'
                        : isFavor
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700';
                      const label = isPending ? 'DEBE' : isFavor ? 'SALDO A FAVOR' : 'AL DIA';

                      return (
                        <tr key={item.id} className={`border-t border-slate-200 text-sm ${rowClass}`}>
                          <td className="px-4 py-3 font-semibold">
                            {item.vendedor?.nombre || 'SIN VENDEDOR'}
                          </td>
                          <td className="px-4 py-3">{item.totalBoletas}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCOP(item.dineroARecoger)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCOP(item.dineroRecogido)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCOP(item.faltante)}</td>
                          <td className="px-4 py-3 font-bold">{label}</td>
                        </tr>
                      );
                    })}
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

export default CajaReportView;
