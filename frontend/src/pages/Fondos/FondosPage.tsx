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

const origenLabels = {
  CAJA_DIARIA: 'Caja diaria',
  CAJA_GENERAL: 'Caja general',
};

const FondosPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [metaOpen, setMetaOpen] = useState(false);
  const [apartadoOpen, setApartadoOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [metaForm, setMetaForm] = useState({
    id: '',
    nombre: '',
    metaTotal: '',
    notas: '',
    activo: true,
  });
  const [apartadoForm, setApartadoForm] = useState({
    fondoId: '',
    origen: 'CAJA_GENERAL',
    valor: '',
    observacion: '',
  });
  const [deleteForm, setDeleteForm] = useState({
    destino: 'CAJA_GENERAL',
    observacion: '',
  });

  const fondos = data?.fondos || [];
  const historial = data?.historial || [];
  const cajas = data?.cajas || {};
  const canEditMeta = user?.rol === 'ADMIN';
  const selectedCaja = cajas[apartadoForm.origen];
  const selectedCajaSaldo = Number(selectedCaja?.saldoActual || 0);
  const apartadoValor = parseNumber(apartadoForm.valor);
  const apartadoExcedeSaldo = apartadoValor > selectedCajaSaldo;

  const loadFondos = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: response } = await client.get(endpoints.fondos());
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los fondos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFondos();
  }, []);

  const historialColumns = useMemo(
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
        key: 'fondo',
        header: 'Fondo',
        render: (row) => (
          <div>
            <p className="font-medium capitalize text-slate-800">{row.fondo?.nombre}</p>
            <p className="text-xs text-slate-500">{row.usuario?.nombre || 'Sin usuario'}</p>
          </div>
        ),
      },
      {
        key: 'origen',
        header: 'Origen',
        render: (row) => origenLabels[row.origen] || row.origen,
      },
      {
        key: 'valor',
        header: 'Valor',
        render: (row) => <span className="font-semibold">{formatCOP(row.valor)}</span>,
      },
      {
        key: 'saldoFondoPosterior',
        header: 'Acumulado',
        render: (row) => formatCOP(row.saldoFondoPosterior),
      },
      {
        key: 'observacion',
        header: 'Observacion',
        render: (row) => row.observacion || 'Sin observacion',
      },
    ],
    []
  );

  const openMetaModal = (fondo?: any) => {
    setError('');
    setMetaForm({
      id: fondo?.id || '',
      nombre: fondo?.nombre || '',
      metaTotal: fondo ? String(Number(fondo.metaTotal || 0)) : '',
      notas: fondo?.notas || '',
      activo: fondo?.activo ?? true,
    });
    setMetaOpen(true);
  };

  const openApartadoModal = (fondo?: any) => {
    setError('');
    setApartadoForm({
      fondoId: fondo?.id || fondos[0]?.id || '',
      origen: 'CAJA_GENERAL',
      valor: '',
      observacion: '',
    });
    setApartadoOpen(true);
  };

  const openDeleteModal = (fondo: any) => {
    setError('');
    setDeleteTarget(fondo);
    setDeleteForm({
      destino: 'CAJA_GENERAL',
      observacion: '',
    });
    setDeleteOpen(true);
  };

  const handleMetaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        nombre: metaForm.nombre,
        metaTotal: parseNumber(metaForm.metaTotal),
        notas: metaForm.notas,
        activo: metaForm.activo,
      };
      const { data: response } = metaForm.id
        ? await client.put(endpoints.fondoById(metaForm.id), payload)
        : await client.post(endpoints.fondos(), payload);
      setData(response);
      setMetaOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar la meta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!deleteTarget) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { data: response } = await client.delete(endpoints.fondoById(deleteTarget.id), {
        data: {
          destino: Number(deleteTarget.acumulado || 0) > 0 ? deleteForm.destino : null,
          observacion: deleteForm.observacion,
        },
      });
      setData(response);
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar la meta.');
    } finally {
      setSaving(false);
    }
  };

  const handleApartadoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: response } = await client.post(endpoints.fondoApartados(), {
        fondoId: apartadoForm.fondoId,
        origen: apartadoForm.origen,
        valor: parseNumber(apartadoForm.valor),
        observacion: apartadoForm.observacion,
      });
      setData(response);
      setApartadoOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar el apartado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Fondos y metas" />
      <div className="space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Dinero apartado por proposito</h2>
            <p className="mt-1 text-sm text-slate-500">Metas, acumulado, faltante e historial.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openApartadoModal()}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Registrar apartado
            </button>
            {canEditMeta ? (
              <button
                type="button"
                onClick={() => openMetaModal()}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Crear fondo
              </button>
            ) : null}
          </div>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <Loading label="Cargando fondos..." />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {fondos.map((fondo) => (
                <article key={fondo.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Fondo</p>
                      <h3 className="mt-2 text-xl font-semibold capitalize text-slate-900">{fondo.nombre}</h3>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {Number(fondo.progreso || 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(Number(fondo.progreso || 0), 100)}%` }}
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Meta</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{formatCOP(fondo.metaTotal)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Acumulado</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{formatCOP(fondo.acumulado)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Faltante</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{formatCOP(fondo.faltante)}</dd>
                    </div>
                  </dl>
                  {fondo.notas ? (
                    <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{fondo.notas}</p>
                  ) : null}
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openApartadoModal(fondo)}
                      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Apartar
                    </button>
                    {canEditMeta ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openMetaModal(fondo)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Meta
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(fondo)}
                          className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Eliminar
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Historial</h3>
              {historial.length === 0 ? (
                <EmptyState
                  title="Sin apartados"
                  description="Registra el primer apartado desde caja diaria o caja general."
                />
              ) : (
                <DataTable columns={historialColumns} data={historial} />
              )}
            </section>
          </>
        )}
      </div>

      <FormModal
        open={metaOpen}
        title={metaForm.id ? 'Editar fondo' : 'Crear fondo'}
        description="Define el proposito y la meta total del fondo."
        onClose={() => setMetaOpen(false)}
      >
        <form onSubmit={handleMetaSubmit} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nombre
            <input
              value={metaForm.nombre}
              onChange={(event) => setMetaForm((current) => ({ ...current, nombre: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ej. arriendo"
              required
            />
          </label>
          <MoneyInput
            label="Meta total"
            value={metaForm.metaTotal}
            onChange={(value) => setMetaForm((current) => ({ ...current, metaTotal: String(value) }))}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Notas
            <textarea
              value={metaForm.notas}
              onChange={(event) => setMetaForm((current) => ({ ...current, notas: event.target.value }))}
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Notas internas de la meta"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={metaForm.activo}
              onChange={(event) => setMetaForm((current) => ({ ...current, activo: event.target.checked }))}
            />
            Fondo activo
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar meta'}
          </button>
        </form>
      </FormModal>

      <FormModal
        open={deleteOpen}
        title="Eliminar meta"
        description={
          Number(deleteTarget?.acumulado || 0) > 0
            ? 'Esta meta tiene dinero acumulado. Selecciona la caja a la que se debe redirigir antes de eliminarla.'
            : 'Esta meta no tiene dinero acumulado y se puede eliminar directamente.'
        }
        onClose={() => setDeleteOpen(false)}
      >
        <form onSubmit={handleDeleteSubmit} className="space-y-4">
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p>
              Meta: <strong className="capitalize">{deleteTarget?.nombre || ''}</strong>
            </p>
            <p className="mt-1">
              Acumulado: <strong>{formatCOP(deleteTarget?.acumulado || 0)}</strong>
            </p>
          </div>
          {Number(deleteTarget?.acumulado || 0) > 0 ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Caja destino
              <select
                value={deleteForm.destino}
                onChange={(event) => setDeleteForm((current) => ({ ...current, destino: event.target.value }))}
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="CAJA_GENERAL">Caja general</option>
                <option value="CAJA_DIARIA">Caja diaria</option>
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Observacion
            <textarea
              value={deleteForm.observacion}
              onChange={(event) => setDeleteForm((current) => ({ ...current, observacion: event.target.value }))}
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Motivo de eliminacion"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Eliminando...' : 'Eliminar meta'}
          </button>
        </form>
      </FormModal>

      <FormModal
        open={apartadoOpen}
        title="Registrar apartado"
        description="El valor se descuenta de la caja seleccionada y aumenta el acumulado del fondo."
        onClose={() => setApartadoOpen(false)}
      >
        <form onSubmit={handleApartadoSubmit} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Fondo
            <select
              value={apartadoForm.fondoId}
              onChange={(event) => setApartadoForm((current) => ({ ...current, fondoId: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
            >
              {fondos.map((fondo) => (
                <option key={fondo.id} value={fondo.id}>
                  {fondo.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Caja origen
            <select
              value={apartadoForm.origen}
              onChange={(event) => setApartadoForm((current) => ({ ...current, origen: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="CAJA_GENERAL">Caja general</option>
              <option value="CAJA_DIARIA">Caja diaria</option>
            </select>
          </label>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p>
              Saldo disponible:{' '}
              <strong>{selectedCaja ? formatCOP(selectedCajaSaldo) : 'Caja no disponible'}</strong>
            </p>
            {selectedCaja?.estado ? <p className="mt-1 text-xs text-slate-500">Estado: {selectedCaja.estado}</p> : null}
          </div>
          <MoneyInput
            label="Valor apartado"
            value={apartadoForm.valor}
            onChange={(value) => setApartadoForm((current) => ({ ...current, valor: String(value) }))}
          />
          {apartadoExcedeSaldo ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              La caja seleccionada no tiene saldo suficiente para este apartado.
            </p>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Observacion
            <textarea
              value={apartadoForm.observacion}
              onChange={(event) =>
                setApartadoForm((current) => ({ ...current, observacion: event.target.value }))
              }
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Detalle del apartado"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !selectedCaja || apartadoExcedeSaldo}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Registrar apartado'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default FondosPage;
