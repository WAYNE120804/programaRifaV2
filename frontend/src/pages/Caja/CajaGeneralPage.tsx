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
import { useAuth } from '../../context/AuthContext';
import { formatCOP, parseNumber } from '../../utils/money';

const movimientoLabels = {
  INGRESO: 'Ingreso',
  EGRESO: 'Salida',
  TRASLADO_SALIDA: 'Traslado salida',
  TRASLADO_ENTRADA: 'Traslado entrada',
  APERTURA: 'Apertura',
  CIERRE: 'Cierre',
};

const CajaGeneralPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [trasladoOpen, setTrasladoOpen] = useState(false);
  const [salidaOpen, setSalidaOpen] = useState(false);
  const [trasladoForm, setTrasladoForm] = useState({
    valor: '',
    motivo: '',
    observacion: '',
  });
  const [salidaForm, setSalidaForm] = useState({
    valor: '',
    motivo: '',
    observacion: '',
  });

  const caja = data?.caja;
  const movimientos = data?.movimientos || [];
  const retiros = data?.retiros || [];
  const canRegisterSalida = user?.rol === 'ADMIN';

  const loadCaja = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: response } = await client.get(endpoints.cajaGeneral());
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la caja general.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCaja();
  }, []);

  const movimientoColumns = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Fecha',
        render: (row) =>
          new Date(row.createdAt).toLocaleString('es-CO', {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        render: (row) => (
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              row.tipo === 'TRASLADO_ENTRADA' || row.tipo === 'INGRESO' || row.tipo === 'APERTURA'
                ? 'bg-emerald-50 text-emerald-700'
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

  const retiroColumns = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Fecha',
        render: (row) =>
          new Date(row.createdAt).toLocaleString('es-CO', {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
      },
      {
        key: 'motivo',
        header: 'Motivo',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-800">{row.motivo}</p>
            <p className="text-xs text-slate-500">{row.observacion || 'Sin observacion'}</p>
          </div>
        ),
      },
      {
        key: 'origen',
        header: 'Origen',
        render: (row) => row.cajaOrigen?.nombre || 'Salida directa',
      },
      {
        key: 'destino',
        header: 'Destino',
        render: (row) => row.cajaDestino?.nombre || 'Fuera del negocio',
      },
      {
        key: 'valor',
        header: 'Valor',
        render: (row) => <span className="font-semibold">{formatCOP(row.valor)}</span>,
      },
    ],
    []
  );

  const handleTraslado = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: response } = await client.post(endpoints.cajaGeneralTraslados(), {
        valor: parseNumber(trasladoForm.valor),
        motivo: trasladoForm.motivo,
        observacion: trasladoForm.observacion,
      });
      setData(response);
      setTrasladoOpen(false);
      setTrasladoForm({ valor: '', motivo: '', observacion: '' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar el traslado.');
    } finally {
      setSaving(false);
    }
  };

  const handleSalida = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: response } = await client.post(endpoints.cajaGeneralSalidas(), {
        valor: parseNumber(salidaForm.valor),
        motivo: salidaForm.motivo,
        observacion: salidaForm.observacion,
      });
      setData(response);
      setSalidaOpen(false);
      setSalidaForm({ valor: '', motivo: '', observacion: '' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar la salida.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Caja general" />
      <div className="space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Consolidado fuera de caja diaria</h2>
            <p className="mt-1 text-sm text-slate-500">Traslados, salidas y saldo disponible.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTrasladoOpen(true)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Trasladar desde caja diaria
            </button>
            {canRegisterSalida ? (
              <button
                type="button"
                onClick={() => setSalidaOpen(true)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Registrar salida
              </button>
            ) : null}
          </div>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <Loading label="Cargando caja general..." />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Estado</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{caja?.estado || 'ABIERTA'}</p>
                <p className="mt-2 text-sm text-slate-500">{caja?.nombre || 'Caja general'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Saldo actual</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {formatCOP(caja?.saldoActual || 0)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Disponible en caja general</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Registros</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{movimientos.length}</p>
                <p className="mt-2 text-sm text-slate-500">Entradas y salidas recientes</p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Historial de movimientos</h3>
              {movimientos.length === 0 ? (
                <EmptyState
                  title="Sin movimientos"
                  description="La caja general se crea automaticamente al abrir esta vista."
                />
              ) : (
                <DataTable columns={movimientoColumns} data={movimientos} />
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Traslados y salidas</h3>
              {retiros.length === 0 ? (
                <EmptyState
                  title="Sin traslados"
                  description="Todavia no hay traslados desde caja diaria ni salidas registradas."
                />
              ) : (
                <DataTable columns={retiroColumns} data={retiros} />
              )}
            </section>
          </>
        )}
      </div>

      <FormModal
        open={trasladoOpen}
        title="Trasladar desde caja diaria"
        description="El valor se descuenta de la caja diaria de hoy y entra a caja general."
        onClose={() => setTrasladoOpen(false)}
      >
        <form onSubmit={handleTraslado} className="space-y-4">
          <MoneyInput
            label="Valor a trasladar"
            value={trasladoForm.valor}
            onChange={(value) =>
              setTrasladoForm((current) => ({ ...current, valor: String(value) }))
            }
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Motivo
            <input
              value={trasladoForm.motivo}
              onChange={(event) =>
                setTrasladoForm((current) => ({ ...current, motivo: event.target.value }))
              }
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ej. Retiro de cierre parcial"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Observacion
            <textarea
              value={trasladoForm.observacion}
              onChange={(event) =>
                setTrasladoForm((current) => ({ ...current, observacion: event.target.value }))
              }
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Notas internas"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Registrar traslado'}
          </button>
        </form>
      </FormModal>

      <FormModal
        open={salidaOpen}
        title="Registrar salida de caja general"
        description="El valor se descuenta del saldo general y queda en historial."
        onClose={() => setSalidaOpen(false)}
      >
        <form onSubmit={handleSalida} className="space-y-4">
          <MoneyInput
            label="Valor de salida"
            value={salidaForm.valor}
            onChange={(value) => setSalidaForm((current) => ({ ...current, valor: String(value) }))}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Motivo
            <input
              value={salidaForm.motivo}
              onChange={(event) =>
                setSalidaForm((current) => ({ ...current, motivo: event.target.value }))
              }
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ej. Pago a proveedor"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Observacion
            <textarea
              value={salidaForm.observacion}
              onChange={(event) =>
                setSalidaForm((current) => ({ ...current, observacion: event.target.value }))
              }
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Detalle de la salida"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Registrar salida'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default CajaGeneralPage;
