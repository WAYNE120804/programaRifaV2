import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const estadoStyles = {
  BORRADOR: 'bg-amber-100 text-amber-700',
  ACTIVA: 'bg-emerald-100 text-emerald-700',
  CERRADA: 'bg-slate-200 text-slate-700',
  SORTEADA: 'bg-indigo-100 text-indigo-700',
  ANULADA: 'bg-rose-100 text-rose-700',
};

const RifaList = () => {
  const [state, setState] = useState({
    rifas: [],
    loading: true,
    error: null,
    deleteId: null,
    deleting: false,
  });

  const fetchRifas = async () => {
    try {
      const { data } = await client.get(endpoints.rifas());
      setState((prev) => ({
        ...prev,
        rifas: data,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        rifas: [],
        loading: false,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    fetchRifas();
  }, []);

  const handleDelete = async () => {
    if (!state.deleteId) {
      return;
    }

    setState((prev) => ({ ...prev, deleting: true, error: null }));

    try {
      await client.delete(endpoints.rifaById(state.deleteId));
      setState((prev) => ({
        ...prev,
        rifas: prev.rifas.filter((rifa) => rifa.id !== state.deleteId),
        deleteId: null,
        deleting: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        deleting: false,
        error: error.message,
      }));
    }
  };

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            estadoStyles[row.estado] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.estado}
        </span>
      ),
    },
    {
      key: 'fechaInicio',
      header: 'Inicio',
      render: (row) => formatDate(row.fechaInicio),
    },
    {
      key: 'fechaFin',
      header: 'Fin',
      render: (row) => formatDate(row.fechaFin),
    },
    {
      key: 'numeroCifras',
      header: 'Cifras',
      render: (row) => `${row.numeroCifras} cifras`,
    },
    {
      key: 'precioBoleta',
      header: 'Precio boleta',
      render: (row) => formatCOP(row.precioBoleta),
    },
    {
      key: 'resumen',
      header: 'Resumen',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row._count?.boletas || 0} boletas, {row._count?.vendedores || 0} vendedores
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <Link className="text-indigo-600" to={`/rifas/${row.id}`}>
            Detalle
          </Link>
          <Link className="text-slate-600" to={`/rifas/${row.id}/editar`}>
            Editar
          </Link>
          <button
            type="button"
            className="text-rose-600"
            onClick={() =>
              setState((prev) => ({ ...prev, deleteId: row.id, error: null }))
            }
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar
        title="Rifas"
        actions={
          <Link
            to="/rifas/crear"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Crear rifa
          </Link>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.rifas.length === 0 && (
          <EmptyState
            title="No hay rifas"
            description="Crea la primera rifa para empezar la operacion."
          />
        )}
        {!state.loading && state.rifas.length > 0 && (
          <DataTable columns={columns} data={state.rifas} />
        )}
      </div>
      <ConfirmDialog
        open={Boolean(state.deleteId)}
        title="Eliminar rifa"
        description="Esta accion eliminara la rifa solo si no tiene boletas, vendedores o ventas asociadas."
        onCancel={() =>
          setState((prev) => ({ ...prev, deleteId: null, deleting: false }))
        }
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default RifaList;
