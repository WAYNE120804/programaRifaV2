import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const MovimientosCaja = () => {
  const [rifas, setRifas] = useState<any[]>([]);
  const [selectedRifaId, setSelectedRifaId] = useState('');
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRifas = async () => {
      try {
        const { data } = await client.get(endpoints.rifas());
        setRifas(data);
        if (data[0]?.id) {
          setSelectedRifaId(data[0].id);
        }
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadRifas();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      if (!selectedRifaId) {
        setSummary(null);
        return;
      }

      try {
        setLoadingSummary(true);
        const { data } = await client.get(endpoints.cajasResumen(), {
          params: { rifaId: selectedRifaId },
        });
        setSummary(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoadingSummary(false);
      }
    };

    void loadSummary();
  }, [selectedRifaId]);

  const rifaOptions = useMemo(
    () =>
      rifas.map((rifa) => ({
        value: rifa.id,
        label: rifa.nombre,
      })),
    [rifas]
  );

  const columns = [
    {
      key: 'fecha',
      header: 'FECHA',
      render: (row: any) => formatDateTime(row.fecha),
    },
    {
      key: 'tipo',
      header: 'TIPO',
    },
    {
      key: 'subCaja',
      header: 'SUBCAJA',
      render: (row: any) => row.subCaja?.nombre || 'SIN SUBCAJA',
    },
    {
      key: 'descripcion',
      header: 'DESCRIPCION',
      render: (row: any) => row.descripcion || 'SIN DESCRIPCION',
    },
    {
      key: 'valor',
      header: 'VALOR',
      render: (row: any) => formatCOP(row.valor),
    },
  ];

  return (
    <div>
      <Topbar title="Movimientos de caja" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Movimientos por rifa
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            Selecciona la rifa para ver ingresos y egresos recientes de caja.
          </p>

          {loading ? (
            <div className="mt-6">
              <Loading label="Cargando rifas..." />
            </div>
          ) : (
            <div className="mt-6 max-w-3xl">
              <SearchableSelect
                options={rifaOptions}
                value={selectedRifaId}
                onChange={setSelectedRifaId}
                placeholder="Selecciona una rifa..."
              />
            </div>
          )}
        </section>

        {loadingSummary ? (
          <Loading label="Cargando movimientos..." />
        ) : summary?.movimientosRecientes?.length ? (
          <section className="theme-section-card rounded-2xl p-6 shadow-sm">
            <DataTable columns={columns} data={summary.movimientosRecientes} />
          </section>
        ) : (
          <EmptyState
            title="Sin movimientos"
            description="Todavia no hay ingresos o egresos registrados para esta rifa."
          />
        )}
      </div>
    </div>
  );
};

export default MovimientosCaja;
