import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatCOP } from '../../utils/money';

const origenLabels = {
  CAJA_DIARIA: 'Caja diaria',
  CAJA_GENERAL: 'Caja general',
  FONDO_META: 'Fondo/meta',
};

const categoriaLabels = {
  ARRIENDO: 'Arriendo',
  SERVICIOS: 'Servicios',
  PROVEEDOR: 'Proveedor',
  TRANSPORTE: 'Transporte',
  NOMINA: 'Nomina',
  OTROS: 'Otros',
  MERCADEO: 'Mercadeo',
  MANTENIMIENTO: 'Mantenimiento',
  IMPUESTOS: 'Impuestos',
  PAPELERIA: 'Papeleria',
};

const GastoTicketPage = () => {
  const { id } = useParams();
  const { config } = useAppConfig();
  const [gasto, setGasto] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGasto = async () => {
      try {
        if (!id) {
          throw new Error('No se encontro el identificador del gasto.');
        }

        const { data } = await client.get(endpoints.gastoById(id));
        setGasto(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadGasto();
  }, [id]);

  const originName = gasto?.fondo?.nombre || gasto?.caja?.nombre || 'Sin origen';

  return (
    <div>
      <Topbar title="Tirilla de gasto" />
      <div className="px-6 py-6">
        <div className="no-print mb-5 flex flex-wrap gap-3">
          <Link
            to="/gastos"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
          >
            Volver a gastos
          </Link>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={() => window.print()}
          >
            Imprimir tirilla
          </button>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <Loading label="Cargando tirilla..." />
        ) : gasto ? (
          <article className="receipt-ticket mx-auto max-w-[360px] rounded-md bg-white p-5 font-mono text-[12px] leading-tight text-slate-950 shadow-sm">
            <header className="border-b border-dashed border-slate-300 pb-3 text-center">
              {config.logoDataUrl ? (
                <img
                  src={config.logoDataUrl}
                  alt={config.nombreNegocio}
                  className="mx-auto mb-2 h-14 max-w-[180px] object-contain"
                />
              ) : null}
              <h1 className="text-base font-bold uppercase">{config.nombreNegocio}</h1>
              {config.propietarioNombre ? <p>{config.propietarioNombre}</p> : null}
              {config.propietarioTelefono ? <p>Tel: {config.propietarioTelefono}</p> : null}
              {config.direccion ? <p>{config.direccion}</p> : null}
              {config.ciudad || config.departamento ? (
                <p>{[config.ciudad, config.departamento].filter(Boolean).join(' - ')}</p>
              ) : null}
            </header>

            <section className="border-b border-dashed border-slate-300 py-3">
              <div className="flex justify-between gap-3">
                <span>Comprobante</span>
                <strong>Gasto</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Fecha</span>
                <span className="text-right">{new Date(gasto.createdAt).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Registrado por</span>
                <span className="text-right">{gasto.usuario?.nombre || 'N/A'}</span>
              </div>
            </section>

            <section className="border-b border-dashed border-slate-300 py-3">
              <div className="flex justify-between gap-3">
                <span>Concepto</span>
                <strong className="text-right">{categoriaLabels[gasto.categoria] || gasto.categoria}</strong>
              </div>
              <div className="mt-2">
                <p className="font-bold">Detalle</p>
                <p>{gasto.descripcion}</p>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span>Origen</span>
                <span className="text-right">{origenLabels[gasto.origen] || gasto.origen}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Cuenta/Fondo</span>
                <span className="text-right">{originName}</span>
              </div>
              {gasto.soporte ? (
                <div className="mt-2">
                  <p className="font-bold">Soporte</p>
                  <p>{gasto.soporte}</p>
                </div>
              ) : null}
            </section>

            <section className="border-b border-dashed border-slate-300 py-3">
              <div className="flex justify-between text-sm font-bold">
                <span>Valor pagado</span>
                <span>{formatCOP(gasto.valor)}</span>
              </div>
            </section>

            {gasto.observacion ? (
              <section className="border-b border-dashed border-slate-300 py-3">
                <p className="font-bold">Observacion</p>
                <p>{gasto.observacion}</p>
              </section>
            ) : null}

            <section className="border-b border-dashed border-slate-300 py-3">
              <p className="font-bold">Recibido por / beneficiario</p>
              <div className="mt-3 space-y-4">
                <div>
                  <p>Nombre:</p>
                  <div className="mt-4 border-b border-slate-900" />
                </div>
                <div>
                  <p>Cedula:</p>
                  <div className="mt-4 border-b border-slate-900" />
                </div>
                <div>
                  <p>Fecha:</p>
                  <div className="mt-4 border-b border-slate-900" />
                </div>
                <div>
                  <p>Firma:</p>
                  <div className="mt-8 border-b border-slate-900" />
                </div>
              </div>
            </section>

            <footer className="pt-3 text-center">
              {config.notasRecibo ? <p>{config.notasRecibo}</p> : <p>Comprobante de pago / gasto.</p>}
              <p className="mt-2 text-[10px]">Sistema administrativo de almacen</p>
            </footer>
          </article>
        ) : null}
      </div>
    </div>
  );
};

export default GastoTicketPage;
