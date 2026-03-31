import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printBoletaSheet } from '../../utils/print';

const useQuery = () => new URLSearchParams(useLocation().search);

const initialRelationForm = {
  rifaId: '',
  vendedorId: '',
  comisionPct: '0',
  precioCasa: '0',
};

const initialAssignmentForm = {
  rifaVendedorId: '',
  metodo: 'ALEATORIA',
  cantidad: '1',
  numeroDesde: '',
  numeroHasta: '',
  listaNumeros: '',
};

const initialReturnForm = {
  rifaVendedorId: '',
  metodo: 'LISTA',
  listaNumeros: '',
};

function extractPreviewNumbers(rawValue, numeroCifras) {
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

const AsignarBoletas = () => {
  const { config } = useAppConfig();
  const query = useQuery();
  const preselectedRifaId = query.get('rifaId') || '';

  const [state, setState] = useState({
    rifas: [],
    vendedores: [],
    rifaVendedores: [],
    assignmentHistory: [],
    returnHistory: [],
    loading: true,
    loadingHistory: false,
    loadingReturnHistory: false,
    error: null,
    success: '',
    deleteId: null,
    editing: null,
  });

  const [form, setForm] = useState({
    ...initialRelationForm,
    rifaId: preselectedRifaId,
  });

  const [filters, setFilters] = useState({
    rifaId: preselectedRifaId,
    vendedorId: '',
  });

  const [editForm, setEditForm] = useState({
    comisionPct: '0',
    precioCasa: '0',
  });

  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [returnForm, setReturnForm] = useState(initialReturnForm);
  const [partialConflict, setPartialConflict] = useState(null);
  const [partialReturnConflict, setPartialReturnConflict] = useState(null);
  const [returnConfirm, setReturnConfirm] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rifasRes, vendedoresRes, rifaVendedoresRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.vendedores()),
          client.get(endpoints.rifaVendedores()),
        ]);

        setState((prev) => ({
          ...prev,
          rifas: rifasRes.data,
          vendedores: vendedoresRes.data,
          rifaVendedores: rifaVendedoresRes.data,
          loading: false,
          error: null,
          success: '',
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (form.rifaId && Number(form.comisionPct) >= 0) {
      const rifa = state.rifas.find((item) => item.id === form.rifaId);

      if (rifa) {
        const precioBoleta = Number(rifa.precioBoleta);
        const comision = (precioBoleta * Number(form.comisionPct)) / 100;
        const precioCasa = precioBoleta - comision;

        setForm((prev) => ({
          ...prev,
          precioCasa: String(Number(precioCasa.toFixed(2))),
        }));
      }
    }
  }, [form.rifaId, form.comisionPct, state.rifas]);

  useEffect(() => {
    if (state.editing && Number(editForm.comisionPct) >= 0) {
      const precioBoleta = Number(state.editing.rifa?.precioBoleta || 0);
      const comision = (precioBoleta * Number(editForm.comisionPct)) / 100;
      const precioCasa = precioBoleta - comision;

      setEditForm((prev) => ({
        ...prev,
        precioCasa: String(Number(precioCasa.toFixed(2))),
      }));
    }
  }, [editForm.comisionPct, state.editing]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!assignmentForm.rifaVendedorId) {
        setState((prev) => ({
          ...prev,
          assignmentHistory: [],
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
          endpoints.asignacionesHistory(assignmentForm.rifaVendedorId)
        );

        setState((prev) => ({
          ...prev,
          assignmentHistory: data,
          loadingHistory: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          assignmentHistory: [],
          loadingHistory: false,
          error: error.message,
        }));
      }
    };

    loadHistory();
  }, [assignmentForm.rifaVendedorId]);

  useEffect(() => {
    const loadReturnHistory = async () => {
      if (!returnForm.rifaVendedorId) {
        setState((prev) => ({
          ...prev,
          returnHistory: [],
          loadingReturnHistory: false,
        }));
        return;
      }

      try {
        setState((prev) => ({
          ...prev,
          loadingReturnHistory: true,
          error: null,
        }));

        const { data } = await client.get(
          endpoints.devolucionesHistory(returnForm.rifaVendedorId)
        );

        setState((prev) => ({
          ...prev,
          returnHistory: data,
          loadingReturnHistory: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          returnHistory: [],
          loadingReturnHistory: false,
          error: error.message,
        }));
      }
    };

    loadReturnHistory();
  }, [returnForm.rifaVendedorId]);

  const rifaOptions = useMemo(
    () =>
      state.rifas.map((rifa) => ({
        value: rifa.id,
        label: `${rifa.nombre} (${formatCOP(rifa.precioBoleta)})`,
      })),
    [state.rifas]
  );

  const vendedorOptions = useMemo(
    () =>
      state.vendedores.map((vendedor) => ({
        value: vendedor.id,
        label: vendedor.nombre,
      })),
    [state.vendedores]
  );

  const relacionesFiltradas = useMemo(() => {
    return state.rifaVendedores.filter((item) => {
      const matchesRifa = filters.rifaId ? item.rifaId === filters.rifaId : true;
      const matchesVendedor = filters.vendedorId
        ? item.vendedorId === filters.vendedorId
        : true;

      return matchesRifa && matchesVendedor;
    });
  }, [state.rifaVendedores, filters]);

  const relationOptions = useMemo(() => {
    return relacionesFiltradas.map((item) => ({
      value: item.id,
      label: `${item.vendedor?.nombre || 'Sin vendedor'} - ${item.rifa?.nombre || 'Sin rifa'}`,
    }));
  }, [relacionesFiltradas]);

  const selectedRelation = useMemo(
    () =>
      state.rifaVendedores.find((item) => item.id === assignmentForm.rifaVendedorId) || null,
    [assignmentForm.rifaVendedorId, state.rifaVendedores]
  );

  const selectedReturnRelation = useMemo(
    () =>
      state.rifaVendedores.find((item) => item.id === returnForm.rifaVendedorId) || null,
    [returnForm.rifaVendedorId, state.rifaVendedores]
  );

  const refreshRelations = async () => {
    const { data } = await client.get(endpoints.rifaVendedores());
    setState((prev) => ({ ...prev, rifaVendedores: data }));
    return data;
  };

  const handleVincular = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: null, success: '' }));

    try {
      const payload = {
        rifaId: form.rifaId,
        vendedorId: form.vendedorId,
        comisionPct: Number(form.comisionPct),
      };

      const { data } = await client.post(endpoints.crearRifaVendedor(), payload);

      setState((prev) => ({
        ...prev,
        rifaVendedores: [...prev.rifaVendedores, data],
        success: 'Relacion creada correctamente.',
      }));

      setFilters((prev) => ({
        ...prev,
        rifaId: data.rifaId,
        vendedorId: data.vendedorId,
      }));

      setAssignmentForm((prev) => ({
        ...prev,
        rifaVendedorId: data.id,
      }));
      setReturnForm((prev) => ({
        ...prev,
        rifaVendedorId: data.id,
      }));

      setForm(initialRelationForm);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const handleDelete = async () => {
    if (!state.deleteId) {
      return;
    }

    try {
      await client.delete(endpoints.eliminarRifaVendedor(state.deleteId));

      setState((prev) => ({
        ...prev,
        rifaVendedores: prev.rifaVendedores.filter((item) => item.id !== state.deleteId),
        deleteId: null,
        success: 'Relacion eliminada correctamente.',
        error: null,
      }));

      if (assignmentForm.rifaVendedorId === state.deleteId) {
        setAssignmentForm(initialAssignmentForm);
      }
      if (returnForm.rifaVendedorId === state.deleteId) {
        setReturnForm(initialReturnForm);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        deleteId: null,
        error: error.message,
      }));
    }
  };

  const openEdit = (row) => {
    setEditForm({
      comisionPct: String(row.comisionPct),
      precioCasa: String(row.precioCasa),
    });

    setState((prev) => ({
      ...prev,
      editing: row,
      error: null,
      success: '',
    }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!state.editing) {
      return;
    }

    try {
      const payload = {
        comisionPct: Number(editForm.comisionPct),
      };

      const { data } = await client.put(
        endpoints.actualizarRifaVendedor(state.editing.id),
        payload
      );

      setState((prev) => ({
        ...prev,
        editing: null,
        rifaVendedores: prev.rifaVendedores.map((item) =>
          item.id === data.id ? data : item
        ),
        success: 'Relacion actualizada correctamente.',
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const executeAssign = async (permitirParcial = false) => {
    if (!assignmentForm.rifaVendedorId) {
      setState((prev) => ({
        ...prev,
        error: 'Debes seleccionar una relacion rifa-vendedor para asignar boletas.',
      }));
      return false;
    }

    try {
      const payload =
        assignmentForm.metodo === 'ALEATORIA'
          ? {
              metodo: 'ALEATORIA',
              cantidad: Number(assignmentForm.cantidad),
              permitirParcial,
            }
          : assignmentForm.metodo === 'RANGO'
            ? {
                metodo: 'RANGO',
                numeroDesde: assignmentForm.numeroDesde,
                numeroHasta: assignmentForm.numeroHasta,
                permitirParcial,
              }
            : {
                metodo: 'LISTA',
                listaNumeros: assignmentForm.listaNumeros,
                permitirParcial,
              };

      const { data } = await client.post(
        endpoints.crearAsignacion(assignmentForm.rifaVendedorId),
        payload
      );

      await refreshRelations();
      const historyRes = await client.get(
        endpoints.asignacionesHistory(assignmentForm.rifaVendedorId)
      );

      setState((prev) => ({
        ...prev,
        assignmentHistory: historyRes.data,
        success: `Asignacion creada correctamente con ${data.cantidad} boletas.`,
        error: null,
      }));

      setAssignmentForm((prev) => ({
        ...initialAssignmentForm,
        rifaVendedorId: prev.rifaVendedorId,
      }));
      setPartialConflict(null);
      return true;
    } catch (error) {
      if (error.code === 'PARTIAL_ASSIGNMENT_CONFLICT' && error.details) {
        setPartialConflict(error.details);
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

  const handleAssign = async (event) => {
    event.preventDefault();
    await executeAssign(false);
  };

  const handleAssignAvailable = async () => {
    await executeAssign(true);
  };

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
          ? { metodo: 'TODAS', permitirParcial }
          : {
              metodo: 'LISTA',
              listaNumeros: returnForm.listaNumeros,
              permitirParcial,
            };

      const { data } = await client.post(
        endpoints.crearDevolucion(returnForm.rifaVendedorId),
        payload
      );

      await refreshRelations();
      const [historyRes, returnHistoryRes] = await Promise.all([
        client.get(endpoints.asignacionesHistory(returnForm.rifaVendedorId)),
        client.get(endpoints.devolucionesHistory(returnForm.rifaVendedorId)),
      ]);

      setState((prev) => ({
        ...prev,
        assignmentHistory: historyRes.data,
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

  const handleReturn = async (event) => {
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

  const handleReturnAvailable = async () => {
    await executeReturn(true);
  };

  const handlePrintAssignment = (row) => {
    if (!selectedRelation) {
      setState((prev) => ({
        ...prev,
        error: 'Debes seleccionar una relacion rifa-vendedor para imprimir boletas.',
      }));
      return;
    }

    try {
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
        rifaNombre: selectedRelation.rifa?.nombre || 'Sin rifa',
        vendedorNombre: selectedRelation.vendedor?.nombre || 'N/A',
        vendedorTelefono: selectedRelation.vendedor?.telefono || 'N/A',
        vendedorDireccion: selectedRelation.vendedor?.direccion || 'N/A',
        boletas: row.detalle.map((item) => item.boleta?.numero).filter(Boolean),
        assignmentSummary: state.assignmentHistory.map((item) => ({
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

  const relationColumns = [
    {
      key: 'vendedor',
      header: 'Vendedor',
      render: (row) => row.vendedor?.nombre || 'N/D',
    },
    {
      key: 'rifa',
      header: 'Rifa',
      render: (row) => row.rifa?.nombre || 'N/D',
    },
    {
      key: 'boletasActuales',
      header: 'Boletas actuales',
      render: (row) => row._count?.boletas || 0,
    },
    {
      key: 'totalAbonado',
      header: 'Total abonado',
      render: (row) => formatCOP(row.totalAbonado || 0),
    },
    {
      key: 'comisionPct',
      header: 'Comision %',
    },
    {
      key: 'precioCasa',
      header: 'Precio al vendedor',
      render: (row) => formatCOP(row.precioCasa),
    },
    {
      key: 'saldoActual',
      header: 'Saldo actual',
      render: (row) => formatCOP(row.saldoActual),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" className="text-indigo-600" onClick={() => openEdit(row)}>
            Editar
          </button>
          <button
            type="button"
            className="text-sky-600"
            onClick={() =>
              setAssignmentForm((prev) => ({
                ...prev,
                rifaVendedorId: row.id,
              }))
            }
          >
            Asignar boletas
          </button>
          <button
            type="button"
            className="text-rose-600"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                deleteId: row.id,
                error: null,
                success: '',
              }))
            }
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: 'vendedor',
      header: 'Vendedor',
      render: (row) => row.rifaVendedor?.vendedor?.nombre || 'N/D',
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (row) => formatDateTime(row.fecha),
    },
    {
      key: 'accion',
      header: 'Accion',
      render: (row) => row.accion || 'ASIGNACION',
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
    },
    {
      key: 'totalTransaccion',
      header: 'Total',
      render: (row) => formatCOP(row.totalTransaccion || 0),
    },
    {
      key: 'detalle',
      header: 'Boletas',
      render: (row) => row.detalle.map((item) => item.boleta?.numero).join(', '),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (row) => (
        <button
          type="button"
          className="text-slate-700 underline underline-offset-2"
          onClick={() => handlePrintAssignment(row)}
        >
          Imprimir boletas
        </button>
      ),
    },
  ];

  const returnColumns = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (row) => formatDateTime(row.fecha),
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      render: (row) => row.detalle.length,
    },
    {
      key: 'detalle',
      header: 'Boletas',
      render: (row) => row.detalle.map((item) => item.boleta?.numero).join(', '),
    },
  ];

  return (
    <div>
      <Topbar
        title="Asignaciones"
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
        {state.loading ? (
          <Loading />
        ) : (
          <>
            <form
              onSubmit={handleVincular}
              className="theme-section-card space-y-4 rounded-lg p-6 shadow-sm"
            >
              <h3 className="theme-main-title theme-content-title text-base font-semibold">Vincular vendedor a rifa</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm text-slate-600">Rifa</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={rifaOptions}
                      value={form.rifaId}
                      onChange={(value) => setForm((prev) => ({ ...prev, rifaId: value }))}
                      placeholder="Buscar rifa..."
                    />
                  </div>
                </div>

                <div>
                  <span className="text-sm text-slate-600">Vendedor</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={vendedorOptions}
                      value={form.vendedorId}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, vendedorId: value }))
                      }
                      placeholder="Buscar vendedor..."
                    />
                  </div>
                </div>

                <label className="block text-sm">
                  <span className="text-slate-600">Comision (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.comisionPct}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, comisionPct: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-slate-600">Precio al vendedor</span>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2"
                    value={form.precioCasa}
                    readOnly
                  />
                </label>
              </div>
              <button
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                type="submit"
              >
                Vincular
              </button>
            </form>

            <div className="theme-section-card rounded-lg p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="theme-main-title theme-content-title text-base font-semibold">Relaciones rifa-vendedor</h3>
                <button
                  type="button"
                  className="text-sm text-slate-600"
                  onClick={() => setFilters({ rifaId: '', vendedorId: '' })}
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm text-slate-600">Buscar por rifa</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={rifaOptions}
                      value={filters.rifaId}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, rifaId: value }))
                      }
                      placeholder="Filtrar por rifa..."
                      clearable
                      clearLabel="Quitar filtro de rifa"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-sm text-slate-600">Buscar por vendedor</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={vendedorOptions}
                      value={filters.vendedorId}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, vendedorId: value }))
                      }
                      placeholder="Filtrar por vendedor..."
                      clearable
                      clearLabel="Quitar filtro de vendedor"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {relacionesFiltradas.length ? (
                  <DataTable columns={relationColumns} data={relacionesFiltradas} />
                ) : (
                  <EmptyState
                    title="Sin resultados"
                    description="No hay relaciones que coincidan con los filtros actuales."
                  />
                )}
              </div>
            </div>

            <form
              onSubmit={handleAssign}
              className="theme-section-card space-y-4 rounded-lg p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="theme-main-title theme-content-title text-base font-semibold">Asignar boletas reales</h3>
                  <p className="theme-content-subtitle text-sm">
                    Puedes asignar por cantidad aleatoria, por rango o pegando una lista.
                  </p>
                </div>
                <Link
                  to="/asignaciones/historial"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Ver historial completo
                </Link>
              </div>

              <div>
                <span className="text-sm text-slate-600">Relacion rifa-vendedor</span>
                <div className="mt-1">
                  <SearchableSelect
                    options={relationOptions}
                    value={assignmentForm.rifaVendedorId}
                    onChange={(value) =>
                      setAssignmentForm((prev) => ({ ...prev, rifaVendedorId: value }))
                    }
                    placeholder="Selecciona la relacion para asignar"
                    clearable
                    clearLabel="Quitar relacion seleccionada"
                  />
                </div>
              </div>

              {selectedRelation ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="theme-summary-card rounded-md px-4 py-3">
                    <div className="theme-summary-label">Rifa</div>
                    <div className="theme-summary-value font-medium">{selectedRelation.rifa?.nombre}</div>
                  </div>
                  <div className="theme-summary-card rounded-md px-4 py-3">
                    <div className="theme-summary-label">Vendedor</div>
                    <div className="theme-summary-value font-medium">{selectedRelation.vendedor?.nombre}</div>
                  </div>
                  <div className="theme-summary-card rounded-md px-4 py-3">
                    <div className="theme-summary-label">Boletas actuales</div>
                    <div className="theme-summary-value font-medium">{selectedRelation._count?.boletas || 0}</div>
                  </div>
                  <div className="theme-summary-card rounded-md px-4 py-3">
                    <div className="theme-summary-label">Saldo actual</div>
                    <div className="theme-summary-value font-medium">{formatCOP(selectedRelation.saldoActual)}</div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="text-slate-600">Metodo</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={assignmentForm.metodo}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        metodo: event.target.value,
                      }))
                    }
                  >
                    <option value="ALEATORIA">Aleatoria por cantidad</option>
                    <option value="RANGO">Por rango</option>
                    <option value="LISTA">Por lista pegada</option>
                  </select>
                </label>
              </div>

              {assignmentForm.metodo === 'ALEATORIA' ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm">
                    <span className="text-slate-600">Cantidad</span>
                    <input
                      type="number"
                      min="1"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={assignmentForm.cantidad}
                      onChange={(event) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          cantidad: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>
              ) : null}

              {assignmentForm.metodo === 'RANGO' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-slate-600">Numero desde</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={assignmentForm.numeroDesde}
                      onChange={(event) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          numeroDesde: event.target.value,
                        }))
                      }
                      placeholder="Ej: 01"
                      required
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600">Numero hasta</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={assignmentForm.numeroHasta}
                      onChange={(event) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          numeroHasta: event.target.value,
                        }))
                      }
                      placeholder="Ej: 20"
                      required
                    />
                  </label>
                </div>
              ) : null}

              {assignmentForm.metodo === 'LISTA' ? (
                <label className="block text-sm">
                  <span className="text-slate-600">Lista de boletas</span>
                  <textarea
                    className="mt-1 min-h-40 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={assignmentForm.listaNumeros}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        listaNumeros: event.target.value,
                      }))
                    }
                    placeholder={`Puedes pegar listas como:
01
05
78

o tambien:
01 02 45 69

o:
01, 02, 78

Tambien se aceptan otros separadores como guiones o punto y coma.`}
                    required
                  />
                </label>
              ) : null}

              <button
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                type="submit"
              >
                Asignar boletas
              </button>
            </form>

            <div className="theme-section-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="theme-main-title theme-content-title text-base font-semibold">Historial inmediato de asignaciones</h3>
                  <p className="theme-content-subtitle text-sm">
                    Se muestra el historial de la relacion seleccionada arriba.
                  </p>
                </div>
                {state.loadingHistory ? (
                  <span className="text-sm text-slate-500">Cargando historial...</span>
                ) : null}
              </div>

              <div className="mt-6">
                {!assignmentForm.rifaVendedorId ? (
                  <EmptyState
                    title="Selecciona una relacion"
                    description="Elige una relacion rifa-vendedor para ver y crear asignaciones de boletas."
                  />
                ) : state.assignmentHistory.length ? (
                  <DataTable columns={historyColumns} data={state.assignmentHistory} />
                ) : (
                  <EmptyState
                    title="Sin asignaciones registradas"
                    description="Todavia no hay asignaciones de boletas para esta relacion."
                  />
                )}
              </div>
            </div>

          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(state.deleteId)}
        title="Eliminar relacion"
        description="Esta accion eliminara la relacion solo si no tiene boletas, asignaciones, devoluciones o abonos asociados."
        onCancel={() => setState((prev) => ({ ...prev, deleteId: null }))}
        onConfirm={handleDelete}
      />

      {state.editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-slate-800">Editar relacion</h3>
            <p className="mt-1 text-sm text-slate-500">
              {state.editing.rifa?.nombre} - {state.editing.vendedor?.nombre}
            </p>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm">
                <span className="text-slate-600">Comision (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={editForm.comisionPct}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      comisionPct: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Precio al vendedor</span>
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2"
                  value={editForm.precioCasa}
                  readOnly
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setState((prev) => ({ ...prev, editing: null }))}
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

      {partialConflict ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800">
              Algunas boletas no estan disponibles
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Puedes continuar con las boletas que si estan disponibles o cancelar la asignacion.
            </p>

            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-800">
                Boletas que si se pueden asignar: {partialConflict.availableNumbers?.join(', ') || 'Ninguna'}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700">Boletas bloqueadas</h4>
              <div className="mt-2 max-h-72 overflow-auto rounded-md border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Boleta</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Asignada a</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partialConflict.unavailable?.map((item) => (
                      <tr key={item.numero} className="border-t border-slate-200">
                        <td className="px-4 py-3">{item.numero}</td>
                        <td className="px-4 py-3">{item.estado}</td>
                        <td className="px-4 py-3">{item.vendedorNombre || 'Sin vendedor vinculado'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setPartialConflict(null)}
              >
                Cancelar asignacion
              </button>
              <button
                type="button"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                onClick={handleAssignAvailable}
                disabled={!partialConflict.availableNumbers?.length}
              >
                Asignar disponibles
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {state.error ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-rose-700">Ocurrio un error</h3>
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {state.error}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                onClick={() => setState((prev) => ({ ...prev, error: null }))}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AsignarBoletas;
