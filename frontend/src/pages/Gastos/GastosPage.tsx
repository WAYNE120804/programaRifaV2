import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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

const origenLabels = {
  CAJA_DIARIA: 'Caja diaria',
  CAJA_GENERAL: 'Caja general',
  FONDO_META: 'Fondo/meta',
};

const categoriaLabels = {
  ARRIENDO: 'Arriendo',
  SERVICIOS: 'Servicios',
  PROVEEDOR: 'Proveedor',
  TRANSPORTE: 'Transporte',
  NOMINA: 'Nomina',
  OTROS: 'Otros',
  MERCADEO: 'Mercadeo',
  MANTENIMIENTO: 'Mantenimiento',
  IMPUESTOS: 'Impuestos',
  PAPELERIA: 'Papeleria',
};

const preferredCategories = ['ARRIENDO', 'SERVICIOS', 'PROVEEDOR', 'TRANSPORTE', 'NOMINA', 'OTROS'];

const GastosPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    origen: 'CAJA_DIARIA',
    fondoId: '',
    categoria: 'PROVEEDOR',
    descripcion: '',
    valor: '',
    soporte: '',
    observacion: '',
  });

  const gastos = data?.gastos || [];
  const resumen = data?.resumen || {};
  const fondos = data?.fondos || [];
  const cajas = data?.cajas || {};
  const categories = preferredCategories.filter((categoria) =>
    (data?.categorias || preferredCategories).includes(categoria)
  );

  const selectedOriginBalance =
    form.origen === 'FONDO_META'
      ? fondos.find((fondo) => fondo.id === form.fondoId)?.acumulado || 0
      : cajas?.[form.origen]?.saldoActual || 0;

  const loadGastos = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: response } = await client.get(endpoints.gastos());
      setData(response);

      if (!form.fondoId && response.fondos?.[0]?.id) {
        setForm((current) => ({ ...current, fondoId: response.fondos[0].id }));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los gastos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGastos();
  }, []);

  const columns = useMemo(
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
        key: 'categoria',
        header: 'Concepto',
        render: (row) => (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {categoriaLabels[row.categoria] || row.categoria}
          </span>
        ),
      },
      {
        key: 'descripcion',
        header: 'Detalle',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-800">{row.descripcion}</p>
            <p className="text-xs text-slate-500">{row.usuario?.nombre || 'Sin usuario'}</p>
          </div>
        ),
      },
      {
        key: 'origen',
        header: 'Origen',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-800">{origenLabels[row.origen] || row.origen}</p>
            <p className="text-xs text-slate-500">{row.fondo?.nombre || row.caja?.nombre || 'Sin origen'}</p>
          </div>
        ),
      },
      {
        key: 'valor',
        header: 'Valor',
        render: (row) => <span className="font-semibold text-rose-700">{formatCOP(row.valor)}</span>,
      },
      {
        key: 'saldoOrigenPosterior',
        header: 'Saldo origen',
        render: (row) => (
          <div className="text-sm">
            <p>{formatCOP(row.saldoOrigenPosterior)}</p>
            <p className="text-xs text-slate-500">Antes {formatCOP(row.saldoOrigenAnterior)}</p>
          </div>
        ),
      },
      {
        key: 'tirilla',
        header: 'Tirilla',
        render: (row) => (
          <Link
            to={`/gastos/${row.id}/tirilla`}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver tirilla
          </Link>
        ),
      },
    ],
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: response } = await client.post(endpoints.gastos(), {
        origen: form.origen,
        fondoId: form.origen === 'FONDO_META' ? form.fondoId : null,
        categoria: form.categoria,
        descripcion: form.descripcion,
        valor: parseNumber(form.valor),
        soporte: form.soporte,
        observacion: form.observacion,
      });
      setData(response);
      setModalOpen(false);
      setForm((current) => ({
        ...current,
        categoria: 'PROVEEDOR',
        descripcion: '',
        valor: '',
        soporte: '',
        observacion: '',
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Gastos y pagos" />
      <div className="space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Egresos clasificados</h2>
            <p className="mt-1 text-sm text-slate-500">Registra pagos desde caja diaria, caja general o fondos.</p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Registrar pago
          </button>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <Loading label="Cargando gastos..." />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Total gastos</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCOP(resumen.totalGastos || 0)}</p>
                <p className="mt-2 text-sm text-slate-500">{resumen.totalRegistros || 0} registros</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Caja diaria</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCOP(cajas.CAJA_DIARIA?.saldoActual || 0)}</p>
                <p className="mt-2 text-sm text-slate-500">{cajas.CAJA_DIARIA?.estado || 'Sin caja abierta'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Caja general</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCOP(cajas.CAJA_GENERAL?.saldoActual || 0)}</p>
                <p className="mt-2 text-sm text-slate-500">Disponible para pagos mayores</p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Historial de pagos</h3>
              {gastos.length === 0 ? (
                <EmptyState title="Sin gastos" description="Registra el primer pago clasificado del almacen." />
              ) : (
                <DataTable columns={columns} data={gastos} />
              )}
            </section>
          </>
        )}
      </div>

      <FormModal
        open={modalOpen}
        title="Registrar pago"
        description="El valor se descuenta automaticamente del origen seleccionado."
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Origen
            <select
              value={form.origen}
              onChange={(event) => setForm((current) => ({ ...current, origen: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="CAJA_DIARIA">Caja diaria</option>
              <option value="CAJA_GENERAL">Caja general</option>
              <option value="FONDO_META">Fondo/meta</option>
            </select>
          </label>

          {form.origen === 'FONDO_META' ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Fondo/meta
              <select
                value={form.fondoId}
                onChange={(event) => setForm((current) => ({ ...current, fondoId: event.target.value }))}
                className="rounded-md border border-slate-300 px-3 py-2"
                required
              >
                {fondos.map((fondo) => (
                  <option key={fondo.id} value={fondo.id}>
                    {fondo.nombre} - {formatCOP(fondo.acumulado)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Saldo disponible del origen: <strong>{formatCOP(selectedOriginBalance)}</strong>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Concepto
            <select
              value={form.categoria}
              onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              {categories.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoriaLabels[categoria] || categoria}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Descripcion
            <input
              value={form.descripcion}
              onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ej. Pago proveedor surtido"
              required
            />
          </label>

          <MoneyInput
            label="Valor"
            value={form.valor}
            onChange={(value) => setForm((current) => ({ ...current, valor: String(value) }))}
            required
          />

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Soporte
            <input
              value={form.soporte}
              onChange={(event) => setForm((current) => ({ ...current, soporte: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Factura, recibo o referencia"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Observacion
            <textarea
              value={form.observacion}
              onChange={(event) => setForm((current) => ({ ...current, observacion: event.target.value }))}
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Notas internas"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Registrar pago'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default GastosPage;
