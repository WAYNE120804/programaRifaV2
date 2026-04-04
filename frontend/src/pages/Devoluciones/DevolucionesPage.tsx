import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime } from '../../utils/dates';

const initialReturnForm = {
  rifaVendedorId: '',
  metodo: 'LISTA',
  destino: 'DISPONIBLE',
  listaNumeros: '',
};

function extractPreviewNumbers(rawValue: string, numeroCifras?: number) {
  const matches = rawValue.match(/\d+/g);

  if (!matches) {
    return [];
  }

  const uniqueValues = [...new Set(matches)];

  return uniqueValues.map((item) => {
    const numericValue = Number(item);

    if (!Number.isInteger(numericValue) || numericValue < 0) {
      return item;
    }

    return typeof numeroCifras === 'number'
      ? String(numericValue).padStart(numeroCifras, '0')
      : item;
  });
}

const DevolucionesPage = () => {
  const [state, setState] = useState({
    loading: true,
    loadingHistory: false,
    relaciones: [],
    usuarios: [],
    returnHistory: [],
    error: null,
    success: '',
  });
  const [returnForm, setReturnForm] = useState(initialReturnForm);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [partialReturnConflict, setPartialReturnConflict] = useState(null);
  const [returnConfirm, setReturnConfirm] = useState(null);

  useEffect(() => {
    const loadRelations = async () => {
      try {
        const [relationsRes, usuariosRes] = await Promise.all([
          client.get(endpoints.rifaVendedores()),
          client.get(endpoints.usuarios()),
        ]);
        setState((prev) => ({
          ...prev,
          loading: false,
          relaciones: relationsRes.data,
          usuarios: usuariosRes.data,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          relaciones: [],
          error: error.message,
        }));
      }
    };

    void loadRelations();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!returnForm.rifaVendedorId) {
        setState((prev) => ({
          ...prev,
          returnHistory: [],
          loadingHistory: false,
        }));
        return;
      }

      try {
        setState((prev) => ({
          ...prev,
          loadingHistory: true,
          error: null,
        }));

        const { data } = await client.get(
          endpoints.devolucionesHistory(returnForm.rifaVendedorId),
          {
            params: {
              ...(selectedUsuarioId ? { usuarioId: selectedUsuarioId } : {}),
            },
          }
        );

        setState((prev) => ({
          ...prev,
          returnHistory: data,
          loadingHistory: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          returnHistory: [],
          loadingHistory: false,
          error: error.message,
        }));
      }
    };

    void loadHistory();
  }, [returnForm.rifaVendedorId, selectedUsuarioId]);

  const relationOptions = useMemo(
    () =>
      state.relaciones.map((item) => ({
        value: item.id,
        label: `${item.vendedor?.nombre || 'Sin vendedor'} - ${item.rifa?.nombre || 'Sin rifa'}`,
      })),
    [state.relaciones]
  );

  const selectedReturnRelation = useMemo(
    () =>
      state.relaciones.find((item) => item.id === returnForm.rifaVendedorId) || null,
    [state.relaciones, returnForm.rifaVendedorId]
  );

  const userOptions = useMemo(
    () =>
      state.usuarios.map((item) => ({
        value: item.id,
        label: `${item.nombre} - ${item.rol}`,
      })),
    [state.usuarios]
  );

  const executeReturn = async (permitirParcial = false) => {
    if (!returnForm.rifaVendedorId) {
      setState((prev) => ({
        ...prev,
        error: 'Debes seleccionar una relacion rifa-vendedor para devolver boletas.',
      }));
      return false;
    }

    try {
      const payload =
        returnForm.metodo === 'TODAS'
          ? { metodo: 'TODAS', permitirParcial, destino: returnForm.destino }
          : {
              metodo: 'LISTA',
              listaNumeros: returnForm.listaNumeros,
              permitirParcial,
              destino: returnForm.destino,
            };

      const { data } = await client.post(
        endpoints.crearDevolucion(returnForm.rifaVendedorId),
        payload
      );

      const [relationsRes, returnHistoryRes] = await Promise.all([
        client.get(endpoints.rifaVendedores()),
        client.get(endpoints.devolucionesHistory(returnForm.rifaVendedorId)),
      ]);

      setState((prev) => ({
        ...prev,
        relaciones: relationsRes.data,
        returnHistory: returnHistoryRes.data,
        success: `Devolucion registrada correctamente con ${data.detalle.length} boletas.`,
        error: null,
      }));

      setReturnForm((prev) => ({
        ...initialReturnForm,
        rifaVendedorId: prev.rifaVendedorId,
      }));
      setReturnConfirm(null);
      setPartialReturnConflict(null);
      return true;
    } catch (error) {
      if (error.code === 'PARTIAL_RETURN_CONFLICT' && error.details) {
        setPartialReturnConflict(error.details);
        setReturnConfirm(null);
        setState((prev) => ({
          ...prev,
          error: null,
          success: '',
        }));
        return false;
      }

      setState((prev) => ({ ...prev, error: error.message }));
      return false;
    }
  };

  const handleReturn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!returnForm.rifaVendedorId) {
      setState((prev) => ({
        ...prev,
        error: 'Debes seleccionar una relacion rifa-vendedor para devolver boletas.',
      }));
      return;
    }

    const previewNumbers =
      returnForm.metodo === 'LISTA'
        ? extractPreviewNumbers(
            returnForm.listaNumeros,
            selectedReturnRelation?.rifa?.numeroCifras
          )
        : [];

    setReturnConfirm({
      metodo: returnForm.metodo,
      previewNumbers,
    });
  };

  const returnColumns = [
    {
      key: 'vendedor',
      header: 'Vendedor',
      render: (row) => row.rifaVendedor?.vendedor?.nombre || 'N/D',
    },
    {
      key: 'usuario',
      header: 'Usuario',
      render: (row) => row.usuario?.nombre || 'SISTEMA',
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (row) => formatDateTime(row.fecha),
    },
    {
      key: 'accion',
      header: 'Accion',
      render: (row) => row.accion || 'DEVOLUCION',
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      render: (row) => row.detalle.length,
    },
    {
      key: 'totalTransaccion',
      header: 'Total',
      render: (row) =>
        new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(row.totalTransaccion || 0),
    },
    {
      key: 'detalle',
      header: 'Boletas',
      render: (row) => row.detalle.map((item) => item.boleta?.numero).join(', '),
    },
  ];

  return (
    <div>
      <Topbar title="Devoluciones" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}

        {state.loading ? (
          <Loading />
        ) : (
          <>
            <form
              onSubmit={handleReturn}
              className="theme-section-card space-y-4 rounded-lg p-6 shadow-sm"
            >
              <div>
                <h3 className="theme-main-title theme-content-title text-base font-semibold">Devolver boletas</h3>
                <p className="theme-content-subtitle text-sm">
                  En la practica puedes devolver todas las boletas del vendedor o pegar la lista de las devueltas.
                </p>
              </div>

              <div>
                <span className="text-sm text-slate-600">Relacion rifa-vendedor</span>
                <div className="mt-1">
                  <SearchableSelect
                    options={relationOptions}
                    value={returnForm.rifaVendedorId}
                    onChange={(value) =>
                      setReturnForm((prev) => ({ ...prev, rifaVendedorId: value }))
                    }
                    placeholder="Selecciona la relacion para devolver"
                    clearable
                    clearLabel="Quitar relacion seleccionada"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="text-slate-600">Metodo</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={returnForm.metodo}
                    onChange={(event) =>
                      setReturnForm((prev) => ({
                        ...prev,
                        metodo: event.target.value,
                      }))
                    }
                  >
                    <option value="LISTA">Por lista pegada</option>
                    <option value="TODAS">Devolver todas</option>
                  </select>
                </label>
                <div>
                  <span className="text-sm text-slate-600">Trabajador</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={userOptions}
                      value={selectedUsuarioId}
                      onChange={setSelectedUsuarioId}
                      placeholder="Todos los trabajadores"
                      clearable
                      clearLabel="Quitar filtro de trabajador"
                    />
                  </div>
                </div>
              </div>

              <label className="block text-sm">
                <span className="text-slate-600">Destino de las boletas devueltas</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={returnForm.destino}
                  onChange={(event) =>
                    setReturnForm((prev) => ({
                      ...prev,
                      destino: event.target.value,
                    }))
                  }
                >
                  <option value="DISPONIBLE">Mostrar nuevamente disponibles</option>
                  <option value="FUERA_CIRCULACION">
                    Guardar como devolucion del vendedor
                  </option>
                </select>
              </label>

              {returnForm.metodo === 'LISTA' ? (
                <label className="block text-sm">
                  <span className="text-slate-600">Lista de boletas devueltas</span>
                  <textarea
                    className="mt-1 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={returnForm.listaNumeros}
                    onChange={(event) =>
                      setReturnForm((prev) => ({
                        ...prev,
                        listaNumeros: event.target.value,
                      }))
                    }
                    placeholder={`Ejemplos:
01
05
78

o tambien:
01 02 45 69

o:
01, 02, 78`}
                    required
                  />
                </label>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Se devolveran todas las boletas que esten actualmente asignadas a esta relacion rifa-vendedor.
                </div>
              )}

              <button
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                type="submit"
              >
                Registrar devolucion
              </button>
            </form>

            <div className="theme-section-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="theme-main-title theme-content-title text-base font-semibold">Historial de devoluciones</h3>
                  <p className="theme-content-subtitle text-sm">
                    Se muestra el historial de la relacion seleccionada arriba.
                  </p>
                </div>
                {state.loadingHistory ? (
                  <span className="text-sm text-slate-500">Cargando devoluciones...</span>
                ) : null}
              </div>

              <div className="mt-6">
                {!returnForm.rifaVendedorId ? (
                  <EmptyState
                    title="Selecciona una relacion"
                    description="Elige una relacion rifa-vendedor para ver y crear devoluciones."
                  />
                ) : state.returnHistory.length ? (
                  <DataTable columns={returnColumns} data={state.returnHistory} />
                ) : (
                  <EmptyState
                    title="Sin devoluciones registradas"
                    description="Todavia no hay devoluciones para esta relacion."
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {returnConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-rose-700">
              Confirma la devolucion de boletas
            </h3>
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-800">
                Esta accion no es reversible.
              </p>
              <p className="mt-2 text-sm text-rose-700">
                {returnForm.destino === 'FUERA_CIRCULACION'
                  ? `Las boletas seleccionadas dejaran de pertenecer a este vendedor y quedaran marcadas como devolucion de ${selectedReturnRelation?.vendedor?.nombre || 'este vendedor'}.`
                  : 'Las boletas seleccionadas dejaran de pertenecer a este vendedor y volveran a quedar disponibles en la rifa.'}
              </p>
            </div>

            <div className="mt-4 rounded-md border border-slate-200 p-4">
              <p className="text-sm text-slate-600">Relacion</p>
              <p className="font-medium text-slate-800">
                {selectedReturnRelation?.rifa?.nombre || 'Sin rifa'} - {selectedReturnRelation?.vendedor?.nombre || 'Sin vendedor'}
              </p>
            </div>

            {returnConfirm.metodo === 'TODAS' ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  Se devolveran todas las boletas actualmente asignadas a este vendedor.
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  Boletas afectadas actualmente: {selectedReturnRelation?._count?.boletas || 0}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700">
                  Boletas que se intentaran devolver
                </p>
                <div className="mt-2 max-h-48 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {returnConfirm.previewNumbers.length ? (
                    returnConfirm.previewNumbers.join(', ')
                  ) : (
                    'No se detectaron boletas validas en la lista pegada.'
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setReturnConfirm(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white"
                onClick={() => {
                  void executeReturn();
                }}
              >
                Confirmar devolucion
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {partialReturnConflict ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-rose-700">
              Algunas boletas no se pueden devolver
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Puedes continuar solo con las boletas que si pertenecen a este vendedor o cancelar la accion.
            </p>

            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Boletas que si se pueden desasignar de este vendedor
              </p>
              <p className="mt-2 text-sm text-amber-800">
                {partialReturnConflict.availableNumbers?.length
                  ? partialReturnConflict.availableNumbers.join(', ')
                  : 'Ninguna'}
              </p>
            </div>

            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-800">
                Si continuas, solo se devolveran las boletas validas.
              </p>
              <p className="mt-2 text-sm text-rose-700">
                Las boletas listadas abajo no se pueden desasignar desde esta relacion porque pertenecen a otro vendedor o no estan en estado ASIGNADA.
              </p>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700">Boletas no retornables</h4>
              <div className="mt-2 max-h-80 overflow-auto rounded-md border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Boleta</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Pertenece a</th>
                      <th className="px-4 py-3">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partialReturnConflict.unavailable?.map((item) => {
                      const owner = item.vendedorNombre || 'Ningun vendedor';
                      const detail =
                        item.vendedorNombre && item.estado === 'ASIGNADA'
                          ? `No se puede desasignar porque pertenece a ${item.vendedorNombre}.`
                          : item.estado === 'DISPONIBLE'
                            ? 'No se puede desasignar porque la boleta ya esta disponible.'
                            : `No se puede desasignar en estado ${item.estado}.`;

                      return (
                        <tr key={item.numero} className="border-t border-slate-200 align-top">
                          <td className="px-4 py-3 font-medium text-slate-800">{item.numero}</td>
                          <td className="px-4 py-3">{item.estado}</td>
                          <td className="px-4 py-3">{owner}</td>
                          <td className="px-4 py-3 text-slate-600">{detail}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setPartialReturnConflict(null)}
              >
                Cancelar devolucion
              </button>
              <button
                type="button"
                className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white"
                onClick={() => {
                  void executeReturn(true);
                }}
                disabled={!partialReturnConflict.availableNumbers?.length}
              >
                Devolver las que si pertenecen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DevolucionesPage;
