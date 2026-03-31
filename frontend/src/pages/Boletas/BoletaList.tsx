import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { formatCOP } from '../../utils/money';
import { printBoletaSheet } from '../../utils/print';
import { useAppConfig } from '../../context/AppConfigContext';

const estadoOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'ASIGNADA', label: 'Asignada' },
  { value: 'RESERVADA', label: 'Reservada' },
  { value: 'VENDIDA', label: 'Vendida' },
  { value: 'PAGADA', label: 'Pagada' },
  { value: 'DEVUELTA', label: 'Devuelta' },
  { value: 'ANULADA', label: 'Anulada' },
];

const statusClasses = {
  DISPONIBLE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ASIGNADA: 'border-sky-200 bg-sky-50 text-sky-700',
  RESERVADA: 'border-amber-200 bg-amber-50 text-amber-700',
  VENDIDA: 'border-violet-200 bg-violet-50 text-violet-700',
  PAGADA: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  DEVUELTA: 'border-orange-200 bg-orange-50 text-orange-700',
  ANULADA: 'border-rose-200 bg-rose-50 text-rose-700',
};

const getInitialRifaId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('rifaId') || '';
};

const initialEditForm = {
  estado: 'DISPONIBLE',
  rifaVendedorId: '',
};

const BoletaList = () => {
  const { config } = useAppConfig();
  const location = useLocation();
  const [state, setState] = useState({
    rifas: [],
    rifaVendedores: [],
    boletas: [],
    loadingSetup: true,
    loadingBoletas: false,
    error: null,
    success: '',
    editing: null,
    confirmRestoreReturned: false,
  });

  const [filters, setFilters] = useState({
    rifaId: getInitialRifaId(),
    rifaVendedorId: '',
    estado: '',
    numero: '',
    vendedorNombre: '',
  });

  const [editForm, setEditForm] = useState(initialEditForm);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      rifaId: new URLSearchParams(location.search).get('rifaId') || prev.rifaId,
    }));
  }, [location.search]);

  useEffect(() => {
    const loadSetup = async () => {
      try {
        const [rifasRes, relacionesRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.rifaVendedores()),
        ]);

        setState((prev) => ({
          ...prev,
          rifas: rifasRes.data,
          rifaVendedores: relacionesRes.data,
          loadingSetup: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loadingSetup: false,
          error: error.message,
        }));
      }
    };

    loadSetup();
  }, []);

  useEffect(() => {
    if (!filters.rifaId) {
      setState((prev) => ({ ...prev, boletas: [], loadingBoletas: false }));
      return;
    }

    const devolucionPorVendedor =
      filters.estado === 'DEVUELTA' && filters.rifaVendedorId && !filters.vendedorNombre
        ? state.rifaVendedores.find((item) => item.id === filters.rifaVendedorId)?.vendedor?.nombre || ''
        : '';

    const loadBoletas = async () => {
      try {
        setState((prev) => ({ ...prev, loadingBoletas: true, error: null }));

        const { data } = await client.get(endpoints.boletas(), {
          params: {
            rifaId: filters.rifaId,
            rifaVendedorId:
              filters.estado === 'DEVUELTA'
                ? undefined
                : filters.rifaVendedorId || undefined,
            estado: filters.estado || undefined,
            numero: filters.numero || undefined,
            vendedorNombre: filters.vendedorNombre || devolucionPorVendedor || undefined,
          },
        });

        setState((prev) => ({
          ...prev,
          boletas: data,
          loadingBoletas: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          boletas: [],
          loadingBoletas: false,
          error: error.message,
        }));
      }
    };

    loadBoletas();
  }, [filters.rifaId, filters.rifaVendedorId, filters.estado, filters.numero, filters.vendedorNombre, state.rifaVendedores]);

  useEffect(() => {
    if (state.editing) {
      setEditForm({
        estado: state.editing.estado,
        rifaVendedorId: state.editing.rifaVendedor?.id || '',
      });
    }
  }, [state.editing]);

  const rifaOptions = useMemo(
    () =>
      state.rifas.map((rifa) => ({
        value: rifa.id,
        label: `${rifa.nombre} (${rifa.numeroCifras} cifras)`,
      })),
    [state.rifas]
  );

  const relationOptions = useMemo(() => {
    return state.rifaVendedores
      .filter((item) => (filters.rifaId ? item.rifaId === filters.rifaId : true))
      .map((item) => ({
        value: item.id,
        label: `${item.vendedor?.nombre || 'Sin vendedor'} (${item.comisionPct}%)`,
      }));
  }, [state.rifaVendedores, filters.rifaId]);

  const selectedRifa = useMemo(
    () => state.rifas.find((item) => item.id === filters.rifaId) || null,
    [state.rifas, filters.rifaId]
  );

  const selectedRelation = useMemo(
    () =>
      state.rifaVendedores.find((item) => item.id === filters.rifaVendedorId) || null,
    [state.rifaVendedores, filters.rifaVendedorId]
  );

  const resumen = useMemo(() => {
    return state.boletas.reduce(
      (acc, boleta) => {
        acc.total += 1;
        acc[boleta.estado] = (acc[boleta.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        DISPONIBLE: 0,
        ASIGNADA: 0,
        RESERVADA: 0,
        VENDIDA: 0,
        PAGADA: 0,
        DEVUELTA: 0,
        ANULADA: 0,
      }
    );
  }, [state.boletas]);

  const openEdit = (boleta) => {
    setState((prev) => ({
      ...prev,
      editing: boleta,
      success: '',
      error: null,
    }));
  };

  const closeEdit = () => {
    setState((prev) => ({
      ...prev,
      editing: null,
    }));
    setEditForm(initialEditForm);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!state.editing) {
      return;
    }

    try {
      const payload = {
        estado: editForm.estado,
        rifaVendedorId:
          editForm.estado === 'DISPONIBLE' ? null : editForm.rifaVendedorId || null,
      };

      const { data } = await client.put(
        endpoints.boletaById(state.editing.id),
        payload
      );

      setState((prev) => ({
        ...prev,
        boletas: prev.boletas.map((item) => (item.id === data.id ? data : item)),
        editing: null,
        success: `Boleta ${data.numero} actualizada correctamente.`,
        error: null,
      }));
      setEditForm(initialEditForm);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const handleCopyBoletas = async () => {
    if (!state.boletas.length) {
      setState((prev) => ({
        ...prev,
        error: 'No hay boletas visibles para copiar con los filtros actuales.',
      }));
      return;
    }

    const content = state.boletas.map((boleta) => boleta.numero).join('\n');

    try {
      await navigator.clipboard.writeText(content);
      setState((prev) => ({
        ...prev,
        success: `${state.boletas.length} boletas copiadas al portapapeles.`,
        error: null,
      }));
    } catch (_error) {
      setState((prev) => ({
        ...prev,
        error: 'No se pudieron copiar las boletas al portapapeles.',
      }));
    }
  };

  const handlePrintBoletas = async () => {
    if (!selectedRelation) {
      setState((prev) => ({
        ...prev,
        error: 'Para imprimir la planilla debes filtrar por un vendedor especifico.',
      }));
      return;
    }

    if (!state.boletas.length) {
      setState((prev) => ({
        ...prev,
        error: 'No hay boletas visibles para imprimir con los filtros actuales.',
      }));
      return;
    }

    try {
      const { data: assignmentHistory } = await client.get(
        endpoints.asignacionesHistory(selectedRelation.id)
      );

      printBoletaSheet({
        companyName: config.nombreCasaRifera,
        logoDataUrl: config.logoDataUrl,
        responsableNombre: config.responsableNombre,
        responsableTelefono: config.responsableTelefono,
        responsableDireccion: config.responsableDireccion,
        responsableCiudad: config.responsableCiudad,
        responsableDepartamento: config.responsableDepartamento,
        numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
        entidadAutoriza: config.entidadAutoriza,
        rifaNombre: selectedRelation.rifa?.nombre || selectedRifa?.nombre || 'Sin rifa',
        vendedorNombre: selectedRelation.vendedor?.nombre || 'N/A',
        vendedorTelefono: selectedRelation.vendedor?.telefono || 'N/A',
        vendedorDireccion: selectedRelation.vendedor?.direccion || 'N/A',
        boletas: state.boletas.map((boleta) => boleta.numero),
        assignmentSummary: assignmentHistory.map((item) => ({
          fecha: item.fecha,
          cantidad: item.cantidad,
        })),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo abrir la impresion de boletas.',
      }));
    }
  };

  const handleRestoreReturnedBoletas = async () => {
    try {
      await Promise.all(
        state.boletas.map((boleta) =>
          client.put(endpoints.boletaById(boleta.id), {
            estado: 'DISPONIBLE',
            rifaVendedorId: null,
          })
        )
      );

      setState((prev) => ({
        ...prev,
        confirmRestoreReturned: false,
        success: `${state.boletas.length} boletas volvieron a estar disponibles.`,
        error: null,
      }));

      setFilters((prev) => ({
        ...prev,
        estado: '',
        rifaVendedorId: '',
        vendedorNombre: '',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        confirmRestoreReturned: false,
        error: error instanceof Error ? error.message : 'No se pudieron reactivar las boletas.',
      }));
    }
  };

  return (
    <div>
      <Topbar
        title="Boletas"
        actions={
          filters.rifaId ? (
            <Link
              to={`/rifas/${filters.rifaId}`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Ver rifa
            </Link>
          ) : null
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}
        {state.loadingSetup ? <Loading /> : null}

        {!state.loadingSetup && (
          <>
            <div className="theme-section-card rounded-lg p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="theme-main-title theme-content-title text-base font-semibold">
                    Filtros de boletas
                  </h3>
                  <p className="theme-content-subtitle text-sm">
                    Selecciona una rifa y luego filtra por estado, vendedor o numero.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-slate-600"
                  onClick={() =>
                    setFilters({
                      rifaId: '',
                      rifaVendedorId: '',
                      estado: '',
                      numero: '',
                      vendedorNombre: '',
                    })
                  }
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <div>
                  <span className="text-sm text-slate-600">Rifa</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={rifaOptions}
                      value={filters.rifaId}
                      onChange={(value) =>
                        setFilters({
                          rifaId: value,
                          rifaVendedorId: '',
                          estado: '',
                          numero: '',
                          vendedorNombre: '',
                        })
                      }
                      placeholder="Buscar rifa..."
                      clearable
                      clearLabel="Quitar filtro de rifa"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-sm text-slate-600">Vendedor asignado</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={relationOptions}
                      value={filters.rifaVendedorId}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, rifaVendedorId: value }))
                      }
                      placeholder="Todos los vendedores"
                      clearable
                      clearLabel="Quitar filtro de vendedor"
                    />
                  </div>
                </div>

                <label className="text-sm">
                  <span className="text-slate-600">Estado</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.estado}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, estado: event.target.value }))
                    }
                  >
                    {estadoOptions.map((option) => (
                      <option key={option.value || 'ALL'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {!filters.rifaId ? (
              <div className="theme-section-card rounded-lg p-6 shadow-sm">
                <EmptyState
                  title="Selecciona una rifa"
                  description="La vista de boletas trabaja por rifa para que la busqueda y la asignacion sean mas claras."
                />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Rifa</p>
                    <p className="theme-summary-value mt-2 text-base font-semibold">
                      {selectedRifa?.nombre || 'N/D'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Precio: {selectedRifa ? formatCOP(selectedRifa.precioBoleta) : 'N/D'}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Total visible</p>
                    <p className="theme-summary-value mt-2 text-2xl font-semibold">
                      {resumen.total}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Disponibles</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-700">
                      {resumen.DISPONIBLE}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Asignadas</p>
                    <p className="mt-2 text-2xl font-semibold text-sky-700">
                      {resumen.ASIGNADA}
                    </p>
                  </div>
                </div>

                <div className="theme-section-card rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="theme-main-title theme-content-title text-base font-semibold">
                        Numeros de la rifa
                      </h3>
                      <p className="theme-content-subtitle text-sm">
                        Haz clic en cualquier cuadro para editar esa boleta.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {filters.estado === 'DEVUELTA' && state.boletas.length > 0 ? (
                        <button
                          type="button"
                          className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              confirmRestoreReturned: true,
                              error: null,
                              success: '',
                            }))
                          }
                        >
                          Hacer disponibles
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleCopyBoletas}
                        disabled={state.loadingBoletas || state.boletas.length === 0}
                      >
                        Copiar boletas
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handlePrintBoletas}
                        disabled={
                          state.loadingBoletas ||
                          state.boletas.length === 0 ||
                          !filters.rifaVendedorId
                        }
                      >
                        Imprimir planilla
                      </button>
                      {state.loadingBoletas ? (
                        <span className="text-sm text-slate-500">Cargando boletas...</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="theme-content-title font-medium">Buscar numero</span>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={filters.numero}
                        onChange={(event) =>
                          setFilters((prev) => ({ ...prev, numero: event.target.value }))
                        }
                        placeholder={
                          selectedRifa
                            ? `Ej: ${'0'.repeat(selectedRifa.numeroCifras)}`
                            : 'Selecciona una rifa'
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="theme-content-title font-medium">
                        Buscar vendedor o devolucion
                      </span>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={filters.vendedorNombre}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            vendedorNombre: event.target.value,
                          }))
                        }
                        placeholder="Ej: Sebastian o Jorge Perez"
                      />
                    </label>
                  </div>

                  <div className="mt-6">
                    {state.loadingBoletas ? (
                      <Loading />
                    ) : state.boletas.length ? (
                      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                        {state.boletas.map((boleta) => (
                          <button
                            key={boleta.id}
                            type="button"
                            onClick={() => openEdit(boleta)}
                            className={`rounded-lg border px-2 py-3 text-center transition hover:scale-[1.02] ${statusClasses[boleta.estado] || 'border-slate-200 bg-slate-50 text-slate-700'}`}
                          >
                            <div className="text-base font-semibold">{boleta.numero}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-wide">
                              {boleta.estado}
                            </div>
                            <div className="mt-1 truncate text-[11px] normal-case">
                              {boleta.rifaVendedor?.vendedor?.nombre ||
                                boleta.devueltaPorVendedorNombre ||
                                'Sin asignar'}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Sin boletas para mostrar"
                        description="Ajusta los filtros para encontrar la boleta o el grupo de boletas que necesitas."
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {state.editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Editar boleta {state.editing.numero}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {state.editing.rifa?.nombre} - Precio {formatCOP(state.editing.precio)}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500"
                onClick={closeEdit}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="text-sm">
                <span className="text-slate-600">Estado</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={editForm.estado}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      estado: event.target.value,
                      rifaVendedorId:
                        event.target.value === 'DISPONIBLE' ? '' : prev.rifaVendedorId,
                    }))
                  }
                >
                  {estadoOptions
                    .filter((option) => option.value)
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <div>
                <span className="text-sm text-slate-600">Asignar a vendedor</span>
                <div className="mt-1">
                  <SearchableSelect
                    options={relationOptions}
                    value={editForm.rifaVendedorId}
                    onChange={(value) =>
                      setEditForm((prev) => ({
                        ...prev,
                        rifaVendedorId: value,
                        estado: prev.estado === 'DISPONIBLE' ? 'ASIGNADA' : prev.estado,
                      }))
                    }
                    placeholder="Sin vendedor asignado"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Si marcas la boleta como disponible, el vendedor se limpia automaticamente.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={closeEdit}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(state.confirmRestoreReturned)}
        title="Volver boletas a disponibles"
        description={`Estas boletas volveran a quedar disponibles para la rifa${filters.rifaVendedorId && selectedRelation?.vendedor?.nombre ? ` y dejaran de figurar como devolucion de ${selectedRelation.vendedor.nombre}` : ''}.`}
        onCancel={() =>
          setState((prev) => ({ ...prev, confirmRestoreReturned: false }))
        }
        onConfirm={handleRestoreReturnedBoletas}
      />
    </div>
  );
};

export default BoletaList;
