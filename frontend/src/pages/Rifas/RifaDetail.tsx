import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { formatDate, formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const RifaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    rifa: null,
    loading: true,
    error: null,
    confirmDelete: false,
    deleting: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await client.get(endpoints.rifaById(id));
        setState({
          rifa: data,
          loading: false,
          error: null,
          confirmDelete: false,
          deleting: false,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    setState((prev) => ({ ...prev, deleting: true, error: null }));

    try {
      await client.delete(endpoints.rifaById(id));
      navigate('/rifas');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        deleting: false,
        confirmDelete: false,
        error: error.message,
      }));
    }
  };

  return (
    <div>
      <Topbar
        title="Detalle de rifa"
        actions={
          <Link className="text-sm text-slate-600" to="/rifas">
            Volver
          </Link>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.rifa && (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {state.rifa.nombre}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Estado actual: {state.rifa.estado}
                  </p>
                </div>
                <Link
                  to={`/rifas/${id}/editar`}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  Editar rifa
                </Link>
                <Link
                  to={`/asignaciones?rifaId=${id}`}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  Ver asignaciones
                </Link>
                <Link
                  to={`/boletas?rifaId=${id}`}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  Ver boletas
                </Link>
                <Link
                  to={`/rifas/${id}/premios`}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  Premios y boletas que juegan
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
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <span className="text-xs uppercase text-slate-400">Loteria</span>
                  <p className="text-base font-semibold">
                    {state.rifa.loteriaNombre || 'N/D'}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Numeracion</span>
                  <p className="text-base font-semibold">
                    {state.rifa.numeroCifras} cifras
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Precio boleta</span>
                  <p className="text-base font-semibold">
                    {formatCOP(state.rifa.precioBoleta)}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Inicio</span>
                  <p className="text-base font-semibold">
                    {formatDate(state.rifa.fechaInicio)}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Fin</span>
                  <p className="text-base font-semibold">
                    {formatDate(state.rifa.fechaFin)}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Creada</span>
                  <p className="text-base font-semibold">
                    {formatDateTime(state.rifa.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-400">Actualizada</span>
                  <p className="text-base font-semibold">
                    {formatDateTime(state.rifa.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h4 className="text-base font-semibold text-slate-800">
                  Resumen operativo
                </h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs uppercase text-slate-400">Boletas</span>
                    <p className="text-lg font-semibold">
                      {state.rifa._count?.boletas || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400">Vendedores</span>
                    <p className="text-lg font-semibold">
                      {state.rifa._count?.vendedores || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400">Premios</span>
                    <p className="text-lg font-semibold">
                      {state.rifa._count?.premios || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400">Ventas</span>
                    <p className="text-lg font-semibold">
                      {state.rifa._count?.ventas || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h4 className="text-base font-semibold text-slate-800">Cajas creadas</h4>
                {state.rifa.cajas?.length ? (
                  <div className="mt-4 space-y-3">
                    {state.rifa.cajas.map((caja) => (
                      <div
                        key={caja.id}
                        className="rounded-md border border-slate-200 px-4 py-3"
                      >
                        <div className="font-medium text-slate-800">{caja.nombre}</div>
                        <div className="text-sm text-slate-500">
                          Saldo: {formatCOP(caja.saldo)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      title="Sin cajas"
                      description="Esta rifa aun no tiene cajas registradas."
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h4 className="text-base font-semibold text-slate-800">
                  Vendedores asociados
                </h4>
                {state.rifa.vendedores?.length ? (
                  <div className="mt-4 space-y-3">
                    {state.rifa.vendedores.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-slate-200 px-4 py-3"
                      >
                        <div className="font-medium text-slate-800">
                          {item.vendedor?.nombre || 'Vendedor sin nombre'}
                        </div>
                        <div className="text-sm text-slate-500">
                          Documento: {item.vendedor?.documento || 'N/D'}
                        </div>
                        <div className="text-sm text-slate-500">
                          Comision: {item.comisionPct}%
                        </div>
                        <div className="text-sm text-slate-500">
                          Precio al vendedor: {formatCOP(item.precioCasa)}
                        </div>
                        <div className="text-sm text-slate-500">
                          Saldo actual: {formatCOP(item.saldoActual)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      title="Sin vendedores asociados"
                      description="Vincula vendedores a esta rifa desde Asignaciones."
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-base font-semibold text-slate-800">
                    Premios configurados
                  </h4>
                  <Link
                    to={`/rifas/${id}/premios`}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                  >
                    Administrar premios
                  </Link>
                </div>
                {state.rifa.premios?.length ? (
                  <div className="mt-4 space-y-3">
                    {state.rifa.premios.map((premio) => (
                      <div
                        key={premio.id}
                        className="rounded-md border border-slate-200 px-4 py-3"
                      >
                        <div className="font-medium text-slate-800">
                          {premio.nombre} · {premio.tipo}
                        </div>
                        <div className="text-sm text-slate-500">
                          Juega: {formatDateTime(premio.fecha)}
                        </div>
                        <div className="text-sm text-slate-500">
                          Valor:{' '}
                          {premio.mostrarValor && premio.valor
                            ? formatCOP(premio.valor)
                            : 'No visible / material'}
                        </div>
                        <div className="text-sm text-slate-500">
                          Descripcion: {premio.descripcion || 'Sin descripcion'}
                        </div>
                        <div className="text-sm text-slate-500">
                          Boletas que juegan: {premio._count?.boletas || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      title="Sin premios configurados"
                      description="Define aqui los premios anticipados y el premio mayor de la rifa."
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={state.confirmDelete}
        title="Eliminar rifa"
        description="Esta accion eliminara la rifa solo si no tiene boletas, vendedores o ventas asociadas."
        onCancel={() =>
          setState((prev) => ({ ...prev, confirmDelete: false, deleting: false }))
        }
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default RifaDetail;
