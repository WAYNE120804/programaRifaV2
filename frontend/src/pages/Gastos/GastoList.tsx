import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
import { printGastoLetterReport } from '../../utils/print';
import { gastoCategoryOptions, getGastoCategoryLabel } from './gastoCategories';

const GastoList = () => {
  const navigate = useNavigate();
  const { config } = useAppConfig();
  const [gastos, setGastos] = useState<any[]>([]);
  const [rifas, setRifas] = useState<any[]>([]);
  const [selectedRifaId, setSelectedRifaId] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [gastosResponse, rifasResponse] = await Promise.all([
          client.get(endpoints.gastos()),
          client.get(endpoints.rifas()),
        ]);

        setGastos(gastosResponse.data);
        setRifas(rifasResponse.data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const rifaOptions = useMemo(
    () =>
      rifas.map((rifa) => ({
        value: rifa.id,
        label: rifa.nombre,
      })),
    [rifas]
  );

  const filteredGastos = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return gastos.filter((gasto) => {
      const matchesRifa = selectedRifaId ? gasto.rifaId === selectedRifaId : true;
      const matchesCategoria = selectedCategoria ? gasto.categoria === selectedCategoria : true;

      if (!matchesRifa || !matchesCategoria) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const descripcion = String(gasto.descripcion || '').toLowerCase();
      const categoria = String(getGastoCategoryLabel(gasto.categoria) || '').toLowerCase();
      const codigo = String(gasto.recibo?.codigoUnico || '').toLowerCase();
      const consecutivo = String(gasto.recibo?.consecutivo || '').toLowerCase();

      return (
        descripcion.includes(normalized) ||
        categoria.includes(normalized) ||
        codigo.includes(normalized) ||
        consecutivo.includes(normalized)
      );
    });
  }, [gastos, searchTerm, selectedCategoria, selectedRifaId]);

  const activeFilteredGastos = useMemo(
    () => filteredGastos.filter((gasto) => !gasto.anuladoAt),
    [filteredGastos]
  );

  const totals = useMemo(() => {
    return {
      totalValor: activeFilteredGastos.reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0),
      totalRegistros: activeFilteredGastos.length,
    };
  }, [activeFilteredGastos]);

  const columns = [
    {
      key: 'fecha',
      header: 'FECHA',
      render: (row: any) => formatDateTime(row.fecha),
    },
    {
      key: 'rifa',
      header: 'RIFA',
      render: (row: any) => row.rifa?.nombre || 'SIN RIFA',
    },
    {
      key: 'valor',
      header: 'VALOR',
      render: (row: any) => formatCOP(row.valor),
    },
    {
      key: 'categoria',
      header: 'CATEGORIA',
      render: (row: any) => getGastoCategoryLabel(row.categoria),
    },
    {
      key: 'descripcion',
      header: 'DESCRIPCION',
    },
    {
      key: 'codigo',
      header: 'CODIGO',
      render: (row: any) => row.recibo?.codigoUnico || 'SIN CODIGO',
    },
    {
      key: 'acciones',
      header: 'ACCIONES',
      render: (row: any) => (
        <div className="flex flex-col gap-1">
          {row.recibo?.id ? (
            <Link className="text-slate-900 underline" to={`/gasto-recibos/${row.recibo.id}`}>
              VER RECIBO
            </Link>
          ) : (
            <span className="text-slate-400">SIN RECIBO</span>
          )}
          {row.anuladoAt ? (
            <span className="text-xs font-semibold text-rose-600">ANULADO</span>
          ) : row.recibo?.id ? (
            <Link className="text-xs text-rose-600 underline" to={`/gasto-recibos/${row.recibo.id}`}>
              ANULAR
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  const selectedRifaLabel =
    rifaOptions.find((option) => option.value === selectedRifaId)?.label || '';
  const selectedCategoriaLabel =
    gastoCategoryOptions.find((option) => option.value === selectedCategoria)?.label || '';

  const gastosForReport = useMemo(
    () =>
      gastos.filter(
        (gasto) => (selectedRifaId ? gasto.rifaId === selectedRifaId : false) && !gasto.anuladoAt
      ),
    [gastos, selectedRifaId]
  );

  const handlePrintReport = () => {
    if (!selectedRifaId || !selectedRifaLabel) {
      setError('Selecciona una rifa para imprimir el informe de gastos.');
      return;
    }

    printGastoLetterReport({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      responsableDireccion: config.responsableDireccion,
      responsableCiudad: config.responsableCiudad,
      responsableDepartamento: config.responsableDepartamento,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      reportTitle: 'Informe de gastos',
      filters: {
        rifa: selectedRifaLabel || undefined,
      },
      gastos: gastosForReport.map((gasto) => ({
        fecha: gasto.fecha,
        valor: gasto.valor,
        categoria: gasto.categoria,
        descripcion: gasto.descripcion,
        codigoUnico: gasto.recibo?.codigoUnico,
        consecutivo: gasto.recibo?.consecutivo,
        rifaNombre: gasto.rifa?.nombre,
      })),
    });
  };

  const handleOpenReport = () => {
    if (!selectedRifaId) {
      setError('Selecciona una rifa para ver el informe de gastos.');
      return;
    }

    navigate(`/gastos/informe?rifaId=${encodeURIComponent(selectedRifaId)}`);
  };

  return (
    <div>
      <Topbar title="Gastos" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Historial de gastos
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            Filtra por rifa o categoria y luego busca por descripcion, codigo unico o consecutivo del recibo.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,280px)_auto]">
            <div>
              <SearchableSelect
                options={rifaOptions}
                value={selectedRifaId}
                onChange={setSelectedRifaId}
                placeholder="Filtrar por rifa..."
                clearable
                clearLabel="Quitar seleccion"
              />
            </div>
            <label className="block text-sm">
              <span className="text-slate-600">Categoria</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={selectedCategoria}
                onChange={(event) => setSelectedCategoria(event.target.value)}
              >
                <option value="">Todas las categorias</option>
                {gastoCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  disabled={!selectedRifaId || !gastosForReport.length}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  IMPRIMIR INFORME
                </button>
                <button
                  type="button"
                  onClick={handleOpenReport}
                  disabled={!selectedRifaId}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  VER INFORME
                </button>
                <Link
                  to="/gastos/crear"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  REGISTRAR GASTO
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="theme-summary-card rounded-2xl p-5">
            <p className="theme-summary-label">TOTAL GASTOS</p>
            <p className="theme-summary-value mt-3 text-3xl font-semibold">
              {totals.totalRegistros}
            </p>
          </div>
          <div className="theme-summary-card rounded-2xl p-5">
            <p className="theme-summary-label">VALOR ACUMULADO</p>
            <p className="theme-summary-value mt-3 text-3xl font-semibold">
              {formatCOP(totals.totalValor)}
            </p>
          </div>
        </div>

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <label className="block text-sm">
            <span className="text-slate-600">Buscar gasto</span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Descripcion, categoria, codigo o consecutivo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </section>

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          {loading ? (
            <Loading label="Cargando gastos..." />
          ) : gastos.length === 0 ? (
            <EmptyState title="Sin gastos" description="Registra un gasto para empezar." />
          ) : filteredGastos.length === 0 ? (
            <EmptyState
              title="No hay coincidencias"
              description="Ajusta la rifa o el texto de busqueda para encontrar el gasto."
            />
          ) : (
            <DataTable columns={columns} data={filteredGastos} />
          )}
        </section>
      </div>
    </div>
  );
};

export default GastoList;
