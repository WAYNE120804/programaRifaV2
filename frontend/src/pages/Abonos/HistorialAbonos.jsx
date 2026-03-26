import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import DataTable from '../../components/common/DataTable';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import SearchableSelect from '../../components/common/SearchableSelect';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const HistorialAbonos = () => {
  const [state, setState] = useState({
    rifaVendedores: [],
    selected: '',
    abonos: [],
    asignaciones: [], // New state for assignments
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadRifaVendedores = async () => {
      try {
        const { data } = await client.get(endpoints.rifaVendedores());
        setState((prev) => ({ ...prev, rifaVendedores: data, loading: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadRifaVendedores();
  }, []);

  const fetchHistory = async (rifaVendedorId) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const [abonosRes, asignacionesRes] = await Promise.all([
        client.get(endpoints.abonosByRifaVendedor(rifaVendedorId)),
        client.get(endpoints.asignacionesHistory(rifaVendedorId))
      ]);
      setState((prev) => ({
        ...prev,
        abonos: abonosRes.data,
        asignaciones: asignacionesRes.data,
        loading: false
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  };

  // Transform data for Select
  const options = useMemo(() => {
    return state.rifaVendedores.map(rv => ({
      value: rv.id,
      label: `${rv.Rifa?.nombre || 'Sin Rifa'} - ${rv.Vendedor?.nombre || 'Sin Vendedor'}`
    }));
  }, [state.rifaVendedores]);

  const selectedData = useMemo(() => {
    return state.rifaVendedores.find(rv => rv.id === state.selected);
  }, [state.rifaVendedores, state.selected]);

  const abonoColumns = [
    { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
    { key: 'valor', header: 'Valor', render: (row) => formatCOP(row.valor) },
    { key: 'medio_pago', header: 'Medio pago' }
  ];

  const asignacionColumns = [
    { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
    { key: 'cantidad', header: 'Cantidad', render: (row) => row.cantidad },
    { key: 'motivo', header: 'Motivo' }
  ];

  return (
    <div>
      <Topbar title="Estado de Cuenta y Abonos" />
      <div className="space-y-6 px-6 py-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-slate-700">Resumen y Acciones</h2>
          <Link
            to="/abonos/crear"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
          >
            Registrar Abono
          </Link>
        </div>
        <ErrorBanner message={state.error} />

        {/* Search & Select Section */}
        <div className="p-4 bg-white rounded-lg shadow-sm space-y-2">
          <h3 className="font-semibold text-lg text-slate-700">Buscar Vendedor</h3>
          <p className="text-sm text-slate-500 mb-2">Busca y selecciona un vendedor para ver su estado de cuenta.</p>
          <div className="max-w-xl">
            <SearchableSelect
              options={options}
              value={state.selected}
              onChange={(value) => {
                setState((prev) => ({ ...prev, selected: value }));
                if (value) fetchHistory(value);
              }}
              placeholder="Escribe para buscar vendedor o rifa..."
            />
          </div>
        </div>

        {/* Selected Summary Card */}
        {selectedData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
              <p className="text-sm text-indigo-600 font-semibold">Total Deuda (Saldo)</p>
              <p className="text-2xl font-bold text-indigo-900">{formatCOP(selectedData.saldo_actual)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-md border border-emerald-100">
              <p className="text-sm text-emerald-600 font-semibold">Boletas Asignadas</p>
              <p className="text-2xl font-bold text-emerald-900">{selectedData.boletas_asignadas}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <p className="text-sm text-slate-600 font-semibold">Comisión Pactada</p>
              <p className="text-2xl font-bold text-slate-900">{selectedData.comision_pct}%</p>
            </div>
          </div>
        )}

        {state.loading && <Loading />}

        {!state.loading && state.selected && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-slate-700">Historial de Abonos</h3>
              {state.abonos.length === 0 ? (
                <p className="text-slate-500 italic">No hay abonos registrados.</p>
              ) : (
                <DataTable columns={abonoColumns} data={state.abonos} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3 text-slate-700">Historial de Asignaciones</h3>
              {state.asignaciones.length === 0 ? (
                <p className="text-slate-500 italic">No hay asignaciones registradas.</p>
              ) : (
                <DataTable columns={asignacionColumns} data={state.asignaciones} />
              )}
            </div>
          </div>
        )}

        {!state.loading && !state.selected && (
          <EmptyState title="Selecciona un vínculo" description="Usa el buscador para encontrar un vendedor y ver su estado de cuenta." />
        )}
      </div>
    </div>
  );
};

export default HistorialAbonos;
