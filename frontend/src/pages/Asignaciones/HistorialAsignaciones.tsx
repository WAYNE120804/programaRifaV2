import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printBoletaSheet } from '../../utils/print';

const HistorialAsignaciones = () => {
  const { config } = useAppConfig();
  const [state, setState] = useState({
    loading: true,
    loadingHistory: false,
    error: null,
    relaciones: [],
    selected: '',
    history: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await client.get(endpoints.rifaVendedores());
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
          relaciones: data,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
          relaciones: [],
        }));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!state.selected) {
        setState((prev) => ({ ...prev, history: [], loadingHistory: false }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, loadingHistory: true, error: null }));
        const { data } = await client.get(endpoints.asignacionesHistory(state.selected));
        setState((prev) => ({
          ...prev,
          history: data,
          loadingHistory: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          history: [],
          loadingHistory: false,
          error: error.message,
        }));
      }
    };

    loadHistory();
  }, [state.selected]);

  const relationOptions = useMemo(() => {
    return state.relaciones.map((item) => ({
      value: item.id,
      label: `${item.vendedor?.nombre || 'Sin vendedor'} - ${item.rifa?.nombre || 'Sin rifa'}`,
    }));
  }, [state.relaciones]);

  const selectedRelation = useMemo(
    () => state.relaciones.find((item) => item.id === state.selected) || null,
    [state.relaciones, state.selected]
  );

  const handlePrintAssignment = (row) => {
    if (!selectedRelation) {
      setState((prev) => ({
        ...prev,
        error: 'Debes seleccionar una relacion para imprimir la planilla.',
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
        assignmentSummary: state.history.map((item) => ({
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
            : 'No se pudo abrir la impresion de la asignacion.',
      }));
    }
  };

  const columns = [
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

  return (
    <div>
      <Topbar title="Historial de asignaciones de boletas" />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading ? <Loading /> : null}

        {!state.loading ? (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="max-w-2xl">
              <span className="text-sm text-slate-600">Relacion rifa-vendedor</span>
              <div className="mt-1">
                <SearchableSelect
                  options={relationOptions}
                  value={state.selected}
                  onChange={(value) =>
                    setState((prev) => ({ ...prev, selected: value }))
                  }
                  placeholder="Selecciona una relacion para ver su historial"
                  clearable
                  clearLabel="Quitar seleccion"
                />
              </div>
            </div>
          </div>
        ) : null}

        {state.loadingHistory ? <Loading /> : null}

        {!state.loading && !state.selected ? (
          <EmptyState
            title="Selecciona una relacion"
            description="Primero elige una relacion rifa-vendedor para consultar el historial de asignaciones."
          />
        ) : null}

        {!state.loading && state.selected && !state.loadingHistory && state.history.length === 0 ? (
          <EmptyState
            title="Sin asignaciones registradas"
            description="Todavia no existen asignaciones de boletas para esta relacion."
          />
        ) : null}

        {!state.loading && state.selected && !state.loadingHistory && state.history.length > 0 ? (
          <DataTable columns={columns} data={state.history} />
        ) : null}
      </div>
    </div>
  );
};

export default HistorialAsignaciones;
