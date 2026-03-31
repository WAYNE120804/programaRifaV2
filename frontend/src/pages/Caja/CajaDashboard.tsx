import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const CajaDashboard = () => {
  const navigate = useNavigate();
  const [rifas, setRifas] = useState<any[]>([]);
  const [selectedRifaId, setSelectedRifaId] = useState('');
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subCajaNombre, setSubCajaNombre] = useState('');
  const [savingSubCaja, setSavingSubCaja] = useState(false);

  useEffect(() => {
    const loadRifas = async () => {
      try {
        const { data } = await client.get(endpoints.rifas());
        setRifas(data);
        if (data[0]?.id) {
          setSelectedRifaId(data[0].id);
        }
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadRifas();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      if (!selectedRifaId) {
        setSummary(null);
        return;
      }

      try {
        setLoadingSummary(true);
        const { data } = await client.get(endpoints.cajasResumen(), {
          params: { rifaId: selectedRifaId },
        });
        setSummary(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoadingSummary(false);
      }
    };

    void loadSummary();
  }, [selectedRifaId]);

  const rifaOptions = useMemo(
    () =>
      rifas.map((rifa) => ({
        value: rifa.id,
        label: rifa.nombre,
      })),
    [rifas]
  );

  const selectedRifa = useMemo(
    () => rifas.find((rifa) => rifa.id === selectedRifaId) || null,
    [rifas, selectedRifaId]
  );

  const handleCreateSubCaja = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRifaId || !subCajaNombre.trim()) {
      return;
    }

    try {
      setSavingSubCaja(true);
      setError(null);
      await client.post(endpoints.subCajas(), {
        rifaId: selectedRifaId,
        nombre: subCajaNombre.trim(),
      });

      const { data } = await client.get(endpoints.cajasResumen(), {
        params: { rifaId: selectedRifaId },
      });
      setSummary(data);
      setSubCajaNombre('');
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingSubCaja(false);
    }
  };

  const handleDeleteSubCaja = async (subCajaId: string) => {
    try {
      setError(null);
      await client.delete(endpoints.subCajaById(subCajaId));
      const { data } = await client.get(endpoints.cajasResumen(), {
        params: { rifaId: selectedRifaId },
      });
      setSummary(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const handleOpenReport = () => {
    if (!selectedRifaId) {
      setError('Selecciona una rifa para ver el informe de caja.');
      return;
    }

    navigate(`/caja/informe?rifaId=${encodeURIComponent(selectedRifaId)}`);
  };

  return (
    <div>
      <Topbar
        title="Caja"
        actions={
          <>
            <button
              type="button"
              onClick={handleOpenReport}
              disabled={!selectedRifaId}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              VER INFORME
            </button>
            <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" to="/caja/movimientos">
              VER MOVIMIENTOS
            </Link>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Caja por rifa
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            Selecciona la rifa para revisar caja general, subcajas y estado de recaudo.
          </p>

          {loading ? (
            <div className="mt-6">
              <Loading label="Cargando rifas..." />
            </div>
          ) : (
            <div className="mt-6 max-w-3xl">
              <SearchableSelect
                options={rifaOptions}
                value={selectedRifaId}
                onChange={setSelectedRifaId}
                placeholder="Selecciona una rifa..."
              />
            </div>
          )}
        </section>

        {loadingSummary ? (
          <Loading label="Cargando resumen de caja..." />
        ) : null}

        {!loadingSummary && summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="theme-summary-card rounded-2xl p-5">
                <p className="theme-summary-label">DINERO A RECOGER</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">
                  {formatCOP(summary.metricas?.dineroPorRecoger || 0)}
                </p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5">
                <p className="theme-summary-label">DINERO RECOGIDO</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">
                  {formatCOP(summary.metricas?.dineroRecogido || 0)}
                </p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5">
                <p className="theme-summary-label">FALTANTE POR RECOGER</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">
                  {formatCOP(summary.metricas?.dineroFaltante || 0)}
                </p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5">
                <p className="theme-summary-label">CAJA GENERAL</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">
                  {formatCOP(summary.cajaGeneral?.saldo || 0)}
                </p>
              </div>
            </div>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                    Subcajas de {selectedRifa?.nombre || summary.rifa?.nombre}
                  </h3>
                  <p className="theme-content-subtitle mt-2 text-sm">
                    Crea subcajas como efectivo, nequi, daviplata, cajera o cuentas bancarias.
                  </p>
                </div>
                <form onSubmit={handleCreateSubCaja} className="flex w-full max-w-xl gap-3">
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Nombre de la subcaja"
                    value={subCajaNombre}
                    onChange={(event) => setSubCajaNombre(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={savingSubCaja || !selectedRifaId || !subCajaNombre.trim()}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    CREAR
                  </button>
                </form>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summary.subcajas?.map((subCaja: any) => (
                  <div key={subCaja.id} className="theme-summary-card rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="theme-summary-label">SUBCAJA</p>
                        <p className="theme-summary-value mt-2 text-2xl font-semibold">
                          {subCaja.nombre}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-rose-600"
                        onClick={() => void handleDeleteSubCaja(subCaja.id)}
                      >
                        ELIMINAR
                      </button>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Saldo</span>
                        <strong>{formatCOP(subCaja.saldo)}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Abonos recibidos</span>
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
                Estado de recaudo por vendedor
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Aqui ves quien ya pago, quien debe y cuanto dinero falta por recoger.
              </p>

              <div className="mt-6">
                {summary.vendedores?.length ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-left text-sm">
                          <th className="px-4 py-3 font-semibold">VENDEDOR</th>
                          <th className="px-4 py-3 font-semibold">TOTAL BOLETAS</th>
                          <th className="px-4 py-3 text-right font-semibold">DINERO A RECOGER</th>
                          <th className="px-4 py-3 text-right font-semibold">DINERO RECOGIDO</th>
                          <th className="px-4 py-3 text-right font-semibold">FALTANTE / SALDO</th>
                          <th className="px-4 py-3 font-semibold">ESTADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.vendedores.map((row: any) => {
                          const isPending = row.estadoCuenta === 'PENDIENTE';
                          const isFavor = row.estadoCuenta === 'SALDO_A_FAVOR';
                          const rowClass = isPending
                            ? 'bg-rose-50 text-rose-700'
                            : isFavor
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700';
                          const label = isPending ? 'DEBE' : isFavor ? 'SALDO A FAVOR' : 'AL DIA';

                          return (
                            <tr key={row.id} className={`border-t border-slate-200 text-sm ${rowClass}`}>
                              <td className="px-4 py-3 font-semibold">{row.vendedor?.nombre || 'SIN VENDEDOR'}</td>
                              <td className="px-4 py-3">{row.totalBoletas}</td>
                              <td className="px-4 py-3 text-right font-semibold">{formatCOP(row.dineroARecoger)}</td>
                              <td className="px-4 py-3 text-right font-semibold">{formatCOP(row.dineroRecogido)}</td>
                              <td className="px-4 py-3 text-right font-semibold">{formatCOP(row.faltante)}</td>
                              <td className="px-4 py-3 font-bold">{label}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="Sin vendedores vinculados"
                    description="Todavia no hay vendedores asociados a esta rifa."
                  />
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default CajaDashboard;
