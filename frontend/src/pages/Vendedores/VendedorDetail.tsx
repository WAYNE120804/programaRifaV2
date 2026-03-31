import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { formatCOP } from '../../utils/money';

const VendedorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    vendedor: null,
    loading: true,
    error: null,
    confirmDelete: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await client.get(endpoints.vendedorById(id));
        setState({
          vendedor: data,
          loading: false,
          error: null,
          confirmDelete: false,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, [id]);

  const totalDeuda = useMemo(() => {
    return (state.vendedor?.rifas || []).reduce(
      (sum, rifaVendedor) => sum + Number(rifaVendedor.saldoActual || 0),
      0
    );
  }, [state.vendedor]);

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    try {
      await client.delete(endpoints.vendedorById(id));
      navigate('/vendedores');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        confirmDelete: false,
        error: error.message,
      }));
    }
  };

  return (
    <div>
      <Topbar
        title="Detalle del vendedor"
        actions={
          <Link className="text-sm text-slate-600" to="/vendedores">
            Volver
          </Link>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.vendedor && (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {state.vendedor.nombre}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Documento: {state.vendedor.documento || 'N/D'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Telefono: {state.vendedor.telefono || 'N/D'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Direccion: {state.vendedor.direccion || 'N/D'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/vendedores/${id}/editar`}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="rounded-md border border-rose-300 px-3 py-1 text-sm text-rose-700"
                    onClick={() =>
                      setState((prev) => ({ ...prev, confirmDelete: true, error: null }))
                    }
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <span className="text-xs uppercase text-slate-400">Rifas asociadas</span>
                  <p className="text-base font-semibold">
                    {state.vendedor._count?.rifas || 0}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Movimientos</span>
                  <p className="text-base font-semibold">
                    {state.vendedor._count?.movimientos || 0}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Saldo acumulado</span>
                  <p className="text-base font-semibold">{formatCOP(totalDeuda)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h4 className="text-base font-semibold text-slate-800">
                Rifas asociadas
              </h4>
              {state.vendedor.rifas?.length ? (
                <div className="mt-4 space-y-3">
                  {state.vendedor.rifas.map((rifaVendedor) => (
                    <div
                      key={rifaVendedor.id}
                      className="rounded-md border border-slate-200 px-4 py-3"
                    >
                      <div className="font-medium text-slate-800">
                        {rifaVendedor.rifa?.nombre || 'Rifa sin nombre'}
                      </div>
                      <div className="text-sm text-slate-500">
                        Estado: {rifaVendedor.rifa?.estado || 'N/D'}
                      </div>
                      <div className="text-sm text-slate-500">
                        Comision: {rifaVendedor.comisionPct}%
                      </div>
                      <div className="text-sm text-slate-500">
                        Precio casa: {formatCOP(rifaVendedor.precioCasa)}
                      </div>
                      <div className="text-sm text-slate-500">
                        Saldo actual: {formatCOP(rifaVendedor.saldoActual)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    title="Sin rifas asociadas"
                    description="La vinculacion con rifas se implementara en el siguiente slice de la Fase 1."
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={state.confirmDelete}
        title="Eliminar vendedor"
        description="Esta accion eliminara el vendedor solo si no tiene rifas ni movimientos asociados."
        onCancel={() => setState((prev) => ({ ...prev, confirmDelete: false }))}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default VendedorDetail;
