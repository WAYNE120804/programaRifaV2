import { FormEvent, useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import FormModal from '../../components/common/FormModal';
import Loading from '../../components/common/Loading';
import MoneyInput from '../../components/common/MoneyInput';
import Topbar from '../../components/Layout/Topbar';
import { formatCOP, parseNumber } from '../../utils/money';

const movimientoLabels = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
  TRASLADO_SALIDA: 'Traslado salida',
  TRASLADO_ENTRADA: 'Traslado entrada',
  APERTURA: 'Apertura',
  CIERRE: 'Cierre',
};

const metodoLabels = {
  EFECTIVO: 'Efectivo',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  MIXTO: 'Mixto',
  OTRO: 'Otro',
};

const todayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const CajaDiariaPage = () => {
  const [data, setData] = useState<any>(null);
  const [fecha, setFecha] = useState(todayKey());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aperturaOpen, setAperturaOpen] = useState(false);
  const [cierreOpen, setCierreOpen] = useState(false);
  const [aperturaForm, setAperturaForm] = useState({
    saldoInicial: '',
    descripcion: '',
  });
  const [cierreForm, setCierreForm] = useState({
    saldoReal: '',
    observaciones: '',
  });

  const caja = data?.caja;
  const resumen = data?.resumen || {};
  const movimientos = data?.movimientos || [];
  const isToday = fecha === todayKey();
  const canOpen = isToday && (!caja || caja.estado === 'CERRADA');
  const canClose = isToday && caja?.estado === 'ABIERTA';

  const loadCaja = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: response } = await client.get(endpoints.cajaDiaria(), {
        params: { fecha },
      });
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la caja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCaja();
  }, [fecha]);

  useEffect(() => {
    if (caja) {
      setCierreForm((current) => ({
        ...current,
        saldoReal: String(Number(caja.saldoActual || 0)),
      }));
    }
  }, [caja?.id, caja?.saldoActual]);

  const movimientoColumns = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Hora',
        render: (row) => new Date(row.createdAt).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        render: (row) => (
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              row.tipo === 'INGRESO' || row.tipo === 'APERTURA'
                ? 'bg-emerald-50 text-emerald-700'
                : row.tipo === 'CIERRE'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-rose-50 text-rose-700'
            }`}
          >
            {movimientoLabels[row.tipo] || row.tipo}
          </span>
        ),
      },
      {
        key: 'descripcion',
        header: 'Detalle',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-800">{row.descripcion || 'Movimiento de caja'}</p>
            <p className="text-xs text-slate-500">{row.usuario?.nombre || 'Sin usuario'}</p>
          </div>
        ),
      },
      {
        key: 'valor',
        header: 'Valor',
        render: (row) => <span className="font-semibold">{formatCOP(row.valor)}</span>,
      },
      {
        key: 'saldoPosterior',
        header: 'Saldo',
        render: (row) => formatCOP(row.saldoPosterior),
      },
    ],
    []
  );

  const handleOpenCaja = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: response } = await client.post(endpoints.cajaDiariaApertura(), {
        saldoInicial: parseNumber(aperturaForm.saldoInicial),
        descripcion: aperturaForm.descripcion,
      });
      setData(response);
      setAperturaOpen(false);
      setAperturaForm({ saldoInicial: '', descripcion: '' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo abrir la caja.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCaja = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: response } = await client.post(endpoints.cajaDiariaCierre(), {
        saldoReal: parseNumber(cierreForm.saldoReal),
        observaciones: cierreForm.observaciones,
      });
      setData(response);
      setCierreOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cerrar la caja.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Caja diaria" />
      <div className="space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Fecha de consulta
            <input
              type="date"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2">
            {canOpen ? (
              <button
                type="button"
                onClick={() => setAperturaOpen(true)}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {caja?.estado === 'CERRADA' ? 'Reabrir caja' : 'Abrir caja'}
              </button>
            ) : null}
            {canClose ? (
              <button
                type="button"
                onClick={() => setCierreOpen(true)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cerrar caja
              </button>
            ) : null}
          </div>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <Loading label="Cargando caja diaria..." />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Estado</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {caja?.estado || 'Sin abrir'}
                </p>
                <p className="mt-2 text-sm text-slate-500">{caja?.nombre || fecha}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Saldo actual</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {formatCOP(caja?.saldoActual || 0)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Disponible en caja diaria</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Ventas del dia</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {formatCOP(resumen.ingresosVentas || 0)}
                </p>
                <p className="mt-2 text-sm text-slate-500">{resumen.ventasCount || 0} ventas pagadas</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Utilidad</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {formatCOP(resumen.utilidadVentas || 0)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Calculada desde ventas pagadas</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_2fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Pagos por metodo</h3>
                <div className="mt-4 space-y-3">
                  {(resumen.pagosPorMetodo || []).length === 0 ? (
                    <p className="text-sm text-slate-500">Todavia no hay pagos registrados.</p>
                  ) : (
                    resumen.pagosPorMetodo.map((item) => (
                      <div key={item.metodo} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">
                          {metodoLabels[item.metodo] || item.metodo}
                        </span>
                        <span className="font-semibold text-slate-900">{formatCOP(item.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Movimientos recientes</h3>
                {movimientos.length === 0 ? (
                  <EmptyState
                    title="Sin movimientos"
                    description="Abre la caja o registra una venta para crear el primer movimiento."
                  />
                ) : (
                  <DataTable columns={movimientoColumns} data={movimientos} />
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <FormModal
        open={aperturaOpen}
        title={caja?.estado === 'CERRADA' ? 'Reabrir caja diaria' : 'Abrir caja diaria'}
        description={
          caja?.estado === 'CERRADA'
            ? 'La caja volvera a quedar disponible para registrar ventas hoy.'
            : 'Define la base inicial que se trasladara desde caja general.'
        }
        onClose={() => setAperturaOpen(false)}
      >
        <form onSubmit={handleOpenCaja} className="space-y-4">
          <MoneyInput
            label="Saldo inicial"
            value={aperturaForm.saldoInicial}
            onChange={(value) =>
              setAperturaForm((current) => ({ ...current, saldoInicial: String(value) }))
            }
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Descripcion
            <textarea
              value={aperturaForm.descripcion}
              onChange={(event) =>
                setAperturaForm((current) => ({ ...current, descripcion: event.target.value }))
              }
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
            placeholder="Ej. Base inicial desde caja general"
          />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando...' : caja?.estado === 'CERRADA' ? 'Reabrir caja' : 'Abrir caja'}
          </button>
        </form>
      </FormModal>

      <FormModal
        open={cierreOpen}
        title="Cerrar caja diaria"
        description="Registra el dinero real contado. Ese valor se trasladara a caja general."
        onClose={() => setCierreOpen(false)}
      >
        <form onSubmit={handleCloseCaja} className="space-y-4">
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Saldo esperado: <strong>{formatCOP(caja?.saldoActual || 0)}</strong>
          </div>
          <MoneyInput
            label="Saldo real contado"
            value={cierreForm.saldoReal}
            onChange={(value) =>
              setCierreForm((current) => ({ ...current, saldoReal: String(value) }))
            }
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Observaciones
            <textarea
              value={cierreForm.observaciones}
              onChange={(event) =>
                setCierreForm((current) => ({ ...current, observaciones: event.target.value }))
              }
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Notas del cierre"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Cerrando...' : 'Cerrar caja'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default CajaDiariaPage;
