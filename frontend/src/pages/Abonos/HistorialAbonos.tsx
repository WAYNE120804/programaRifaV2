import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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
import { printAbonosSummaryTicket } from '../../utils/print';

const HistorialAbonos = () => {
  const { config } = useAppConfig();
  const [rifaVendedores, setRifaVendedores] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [abonos, setAbonos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [relationsRes, usuariosRes] = await Promise.all([
          client.get(endpoints.rifaVendedores()),
          client.get(endpoints.usuarios()),
        ]);
        setRifaVendedores(relationsRes.data);
        setUsuarios(usuariosRes.data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selected) {
        setAbonos([]);
        return;
      }

      try {
        setLoadingHistory(true);
        setSearchTerm('');
        const { data } = await client.get(endpoints.abonosByRifaVendedor(selected), {
          params: {
            ...(selectedUsuarioId ? { usuarioId: selectedUsuarioId } : {}),
          },
        });
        setAbonos(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadHistory();
  }, [selected, selectedUsuarioId]);

  const options = useMemo(
    () =>
      rifaVendedores.map((item) => ({
        value: item.id,
        label: `${item.rifa?.nombre || 'Sin rifa'} - ${item.vendedor?.nombre || 'Sin vendedor'}`,
      })),
    [rifaVendedores]
  );

  const selectedRelation = useMemo(
    () => rifaVendedores.find((item) => item.id === selected) || null,
    [rifaVendedores, selected]
  );

  const userOptions = useMemo(
    () =>
      usuarios.map((item) => ({
        value: item.id,
        label: `${item.nombre} - ${item.rol}`,
      })),
    [usuarios]
  );

  const filteredAbonos = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    if (!normalized) {
      return abonos;
    }

    return abonos.filter((row) => {
      const codigo = String(row.recibo?.codigoUnico || '').toLowerCase();
      const consecutivo = String(row.recibo?.consecutivo || '').toLowerCase();
      return codigo.includes(normalized) || consecutivo.includes(normalized);
    });
  }, [abonos, searchTerm]);

  const activeFilteredAbonos = useMemo(
    () => filteredAbonos.filter((row) => !row.anuladoAt),
    [filteredAbonos]
  );

  const columns = [
    {
      key: 'fecha',
      header: 'FECHA',
      render: (row: any) => formatDateTime(row.fecha),
    },
    {
      key: 'usuario',
      header: 'USUARIO',
      render: (row: any) => row.usuario?.nombre || 'SISTEMA',
    },
    {
      key: 'valor',
      header: 'VALOR',
      render: (row: any) => formatCOP(row.valor),
    },
    {
      key: 'saldoAnterior',
      header: 'DEUDA ANTERIOR',
      render: (row: any) => formatCOP(row.saldoAnterior),
    },
    {
      key: 'saldoDespues',
      header: 'DEUDA DESPUES',
      render: (row: any) => formatCOP(row.saldoDespues),
    },
    {
      key: 'boletasActuales',
      header: 'BOLETAS',
    },
    {
      key: 'subCaja',
      header: 'SUBCAJA',
      render: (row: any) => row.subCaja?.nombre || 'SIN SUBCAJA',
    },
    {
      key: 'metodoPago',
      header: 'METODO',
    },
    {
      key: 'descripcion',
      header: 'DESCRIPCION',
      render: (row: any) => row.descripcion || 'SIN DESCRIPCION',
    },
    {
      key: 'acciones',
      header: 'ACCIONES',
      render: (row: any) => (
        <div className="flex flex-col gap-1">
          {row.recibo?.id ? (
            <Link className="text-slate-900 underline" to={`/recibos/${row.recibo.id}`}>
              VER RECIBO
            </Link>
          ) : (
            <span className="text-slate-400">SIN RECIBO</span>
          )}
          {row.anuladoAt ? (
            <span className="text-xs font-semibold text-rose-600">ANULADO</span>
          ) : row.recibo?.id ? (
            <Link className="text-xs text-rose-600 underline" to={`/recibos/${row.recibo.id}`}>
              ANULAR
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  const handlePrintSummary = () => {
    if (!selectedRelation || !activeFilteredAbonos.length) {
      return;
    }

    printAbonosSummaryTicket({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      rifaNombre: selectedRelation.rifa?.nombre || 'SIN RIFA',
      vendedorNombre: selectedRelation.vendedor?.nombre || 'SIN VENDEDOR',
      vendedorDocumento: selectedRelation.vendedor?.documento,
      vendedorTelefono: selectedRelation.vendedor?.telefono,
      deudaActual: selectedRelation.saldoActual || 0,
      boletasActuales: selectedRelation._count?.boletas || 0,
      abonos: activeFilteredAbonos.map((item) => ({
        fecha: item.fecha,
        valor: item.valor,
        codigoUnico: item.recibo?.codigoUnico || null,
      })),
    });
  };

  return (
    <div>
      <Topbar title="Abonos" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Estado de cuenta del vendedor
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            Selecciona la relacion rifa-vendedor para revisar deuda, boletas actuales y abonos registrados.
          </p>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)_auto] lg:items-start">
            <div className="w-full">
              <SearchableSelect
                options={options}
                value={selected}
                onChange={setSelected}
                placeholder="Buscar por rifa o vendedor..."
                clearable
                clearLabel="Quitar seleccion"
              />
            </div>
            <div className="w-full">
              <SearchableSelect
                options={userOptions}
                value={selectedUsuarioId}
                onChange={setSelectedUsuarioId}
                placeholder="Filtrar por trabajador..."
                clearable
                clearLabel="Quitar filtro de trabajador"
              />
            </div>
            <Link
              to={selected ? `/abonos/crear?rifaVendedor=${selected}` : '/abonos/crear'}
              className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700"
            >
              REGISTRAR ABONO
            </Link>
          </div>
        </section>

        {selectedRelation ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="theme-summary-card rounded-2xl p-5">
              <p className="theme-summary-label">RIFA</p>
              <p className="theme-summary-value mt-3 text-3xl font-semibold">
                {selectedRelation.rifa?.nombre}
              </p>
            </div>
            <div className="theme-summary-card rounded-2xl p-5">
              <p className="theme-summary-label">VENDEDOR</p>
              <p className="theme-summary-value mt-3 text-3xl font-semibold">
                {selectedRelation.vendedor?.nombre}
              </p>
            </div>
            <div className="theme-summary-card rounded-2xl p-5">
              <p className="theme-summary-label">DEUDA ACTUAL</p>
              <p className="theme-summary-value mt-3 text-3xl font-semibold">
                {formatCOP(selectedRelation.saldoActual)}
              </p>
            </div>
            <div className="theme-summary-card rounded-2xl p-5">
              <p className="theme-summary-label">BOLETAS ACTUALES</p>
              <p className="theme-summary-value mt-3 text-3xl font-semibold">
                {selectedRelation._count?.boletas || 0}
              </p>
            </div>
          </div>
        ) : null}

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Historial de abonos
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            Cada abono queda con deuda anterior, deuda resultante y recibo verificable.
          </p>

          {selected ? (
            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="w-full max-w-xl">
                <label className="block text-sm">
                  <span className="text-slate-600">Buscar por codigo unico o consecutivo</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Ej: RIFA1234-1986-000001-50000 o 1"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>
                </div>
                <div className="w-full max-w-sm">
                  <label className="block text-sm">
                    <span className="text-slate-600">Trabajador</span>
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
                  </label>
                </div>
              <button
                type="button"
                disabled={!activeFilteredAbonos.length}
                onClick={handlePrintSummary}
                className="rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                IMPRIMIR RESUMEN
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6">
              <Loading label="Cargando relaciones..." />
            </div>
          ) : loadingHistory ? (
            <div className="mt-6">
              <Loading label="Cargando abonos..." />
            </div>
          ) : !selected ? (
            <div className="mt-6">
              <EmptyState
                title="Selecciona una relacion"
                description="Usa el buscador de arriba para ver el estado de cuenta y los recibos."
              />
            </div>
          ) : abonos.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No hay abonos registrados"
                description="Esta relacion todavia no tiene abonos registrados."
              />
            </div>
          ) : filteredAbonos.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No hay coincidencias"
                description="Ajusta el codigo unico o el consecutivo para encontrar el abono."
              />
            </div>
          ) : (
            <div className="mt-6">
              <DataTable columns={columns} data={filteredAbonos} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HistorialAbonos;
