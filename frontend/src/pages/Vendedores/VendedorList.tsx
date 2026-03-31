import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';

const VendedorList = () => {
  const [state, setState] = useState({
    vendedores: [],
    loading: true,
    error: null,
    deleteId: null,
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const { data } = await client.get(endpoints.vendedores());
        setState((prev) => ({
          ...prev,
          vendedores: data,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          vendedores: [],
          loading: false,
          error: error.message,
        }));
      }
    };

    fetchVendedores();
  }, []);

  const handleDelete = async () => {
    if (!state.deleteId) {
      return;
    }

    try {
      await client.delete(endpoints.vendedorById(state.deleteId));
      setState((prev) => ({
        ...prev,
        vendedores: prev.vendedores.filter((vendedor) => vendedor.id !== state.deleteId),
        deleteId: null,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        deleteId: null,
        error: error.message,
      }));
    }
  };

  const vendedoresFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return state.vendedores;
    }

    return state.vendedores.filter((vendedor) => {
      return [
        vendedor.nombre,
        vendedor.documento,
        vendedor.telefono,
        vendedor.direccion,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [search, state.vendedores]);

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'documento', header: 'Documento' },
    { key: 'telefono', header: 'Telefono' },
    { key: 'direccion', header: 'Direccion' },
    {
      key: 'resumen',
      header: 'Resumen',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row._count?.rifas || 0} rifas asociadas
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <Link className="text-indigo-600" to={`/vendedores/${row.id}`}>
            Detalle
          </Link>
          <Link className="text-slate-600" to={`/vendedores/${row.id}/editar`}>
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
        title="Vendedores"
        actions={
          <Link
            to="/vendedores/crear"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Crear vendedor
          </Link>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <label className="block text-sm">
              <span className="text-slate-600">Buscar vendedor</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, documento, telefono o direccion"
              />
            </label>
          </div>
        )}
        {!state.loading && vendedoresFiltrados.length === 0 && (
          <EmptyState
            title={state.vendedores.length === 0 ? 'No hay vendedores' : 'Sin resultados'}
            description={
              state.vendedores.length === 0
                ? 'Registra tu primer vendedor para empezar.'
                : 'No hay vendedores que coincidan con la busqueda actual.'
            }
          />
        )}
        {!state.loading && vendedoresFiltrados.length > 0 && (
          <DataTable columns={columns} data={vendedoresFiltrados} />
        )}
      </div>
      <ConfirmDialog
        open={Boolean(state.deleteId)}
        title="Eliminar vendedor"
        description="Esta accion eliminara el vendedor solo si no tiene rifas ni movimientos asociados."
        onCancel={() => setState((prev) => ({ ...prev, deleteId: null }))}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default VendedorList;
