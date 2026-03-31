import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printGastoLetterReport } from '../../utils/print';
import { getGastoCategoryLabel } from './gastoCategories';

const GastoReportView = () => {
  const { config } = useAppConfig();
  const [searchParams] = useSearchParams();
  const rifaId = searchParams.get('rifaId') || '';
  const [gastos, setGastos] = useState<any[]>([]);
  const [rifa, setRifa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!rifaId) {
        setError('No se envio una rifa para construir el informe.');
        setLoading(false);
        return;
      }

      try {
        const [gastosResponse, rifaResponse] = await Promise.all([
          client.get(endpoints.gastos()),
          client.get(endpoints.rifaById(rifaId)),
        ]);

        const nextGastos = (gastosResponse.data || []).filter(
          (gasto: any) => gasto.rifaId === rifaId && !gasto.anuladoAt
        );

        setGastos(nextGastos);
        setRifa(rifaResponse.data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [rifaId]);

  const categories = useMemo(() => {
    const grouped = gastos.reduce<Record<string, any[]>>((acc, gasto) => {
      const key = gasto.categoria || 'OTROS';
      acc[key] = acc[key] || [];
      acc[key].push(gasto);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([categoria, items]) => ({
        categoria,
        label: getGastoCategoryLabel(categoria),
        items: [...items].sort(
          (left, right) => new Date(right.fecha).getTime() - new Date(left.fecha).getTime()
        ),
        total: items.reduce((sum, item) => sum + Number(item.valor || 0), 0),
      }))
      .sort((left, right) => right.total - left.total);
  }, [gastos]);

  const totalGeneral = useMemo(
    () => categories.reduce((sum, category) => sum + category.total, 0),
    [categories]
  );

  const maxCategoryTotal = useMemo(
    () => Math.max(...categories.map((category) => category.total), 1),
    [categories]
  );

  const handlePrint = () => {
    if (!rifa) {
      return;
    }

    printGastoLetterReport({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      responsableDireccion: config.responsableDireccion,
      responsableCiudad: config.responsableCiudad,
      responsableDepartamento: config.responsableDepartamento,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      reportTitle: 'Informe de gastos',
      filters: {
        rifa: rifa.nombre,
      },
      gastos: gastos.map((gasto) => ({
        fecha: gasto.fecha,
        valor: gasto.valor,
        categoria: gasto.categoria,
        descripcion: gasto.descripcion,
        codigoUnico: gasto.recibo?.codigoUnico,
        consecutivo: gasto.recibo?.consecutivo,
        rifaNombre: gasto.rifa?.nombre,
      })),
    });
  };

  return (
    <div>
      <Topbar
        title="Informe de gastos"
        actions={
          <>
            <Link
              to="/gastos"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              VOLVER A GASTOS
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!gastos.length}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              IMPRIMIR INFORME
            </button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />

        {loading ? <Loading label="Construyendo informe..." /> : null}

        {!loading && !gastos.length ? (
          <EmptyState
            title="Sin gastos para esta rifa"
            description="Esta rifa no tiene gastos registrados para construir el informe."
          />
        ) : null}

        {!loading && gastos.length ? (
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
                    Informe de gastos
                  </h2>
                  <p className="theme-content-subtitle mt-2 text-sm">
                    Resumen ejecutivo y detalle completo de gastos para la rifa seleccionada.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">RIFA</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {rifa?.nombre || 'SIN RIFA'}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">RESPONSABLE</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {config.responsableNombre || 'SIN RESPONSABLE'}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">TOTAL GASTOS</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {gastos.length}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-4">
                      <p className="theme-summary-label">VALOR TOTAL</p>
                      <p className="theme-summary-value mt-2 text-lg font-semibold">
                        {formatCOP(totalGeneral)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <div className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Distribucion por categoria
                </h3>
                <p className="theme-content-subtitle mt-2 text-sm">
                  Vista rapida para identificar en que categorias se concentra el gasto.
                </p>
                <div className="mt-6 space-y-4">
                  {categories.map((category) => {
                    const width = Math.max(6, Math.round((category.total / maxCategoryTotal) * 100));

                    return (
                      <div key={category.categoria} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_120px] md:items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{category.label}</p>
                          <p className="text-xs text-slate-500">{category.items.length} gastos</p>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-orange-400"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <p className="text-right text-sm font-semibold text-slate-900">
                          {formatCOP(category.total)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Totales por categoria
                </h3>
                <p className="theme-content-subtitle mt-2 text-sm">
                  Resumen final del informe para revision rapida.
                </p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-left text-sm">
                        <th className="px-4 py-3 font-semibold">CATEGORIA</th>
                        <th className="px-4 py-3 font-semibold">CANTIDAD</th>
                        <th className="px-4 py-3 text-right font-semibold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.categoria} className="border-t border-slate-200 text-sm">
                          <td className="px-4 py-3">{category.label}</td>
                          <td className="px-4 py-3">{category.items.length}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCOP(category.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 text-sm font-bold">
                        <td className="px-4 py-3" colSpan={2}>
                          TOTAL GENERAL
                        </td>
                        <td className="px-4 py-3 text-right">{formatCOP(totalGeneral)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>

            {categories.map((category) => (
              <section key={category.categoria} className="theme-section-card rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                      {category.label}
                    </h3>
                    <p className="theme-content-subtitle mt-2 text-sm">
                      {category.items.length} gastos registrados en esta categoria.
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatCOP(category.total)}
                  </p>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-left text-sm">
                        <th className="px-4 py-3 font-semibold">FECHA Y HORA</th>
                        <th className="px-4 py-3 font-semibold">RIFA</th>
                        <th className="px-4 py-3 font-semibold">DESCRIPCION</th>
                        <th className="px-4 py-3 font-semibold">CODIGO</th>
                        <th className="px-4 py-3 text-right font-semibold">VALOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-200 text-sm">
                          <td className="px-4 py-3">{formatDateTime(item.fecha)}</td>
                          <td className="px-4 py-3">{item.rifa?.nombre || 'SIN RIFA'}</td>
                          <td className="px-4 py-3">{item.descripcion}</td>
                          <td className="px-4 py-3">{item.recibo?.codigoUnico || 'SIN CODIGO'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCOP(item.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default GastoReportView;
