import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import ReceiptTicket from '../../components/receipts/ReceiptTicket';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const ReciboPublicView = () => {
  const { codigo } = useParams();
  const { config } = useAppConfig();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        const { data } = await client.get(endpoints.reciboByCodigo(codigo));
        setReceipt(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadReceipt();
  }, [codigo]);

  const verificationUrl = useMemo(() => window.location.href, []);
  const abono = receipt?.abono;
  const relation = abono?.rifaVendedor;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            RECIBO VERIFICADO
          </p>
          <h1 className="mt-2 text-center text-3xl font-bold uppercase text-slate-900">
            Verificacion de abono
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Esta pagina confirma que el recibo corresponde a un abono registrado en el sistema.
          </p>
        </div>

        <ErrorBanner message={error} />
        {loading ? <Loading label="Consultando recibo..." /> : null}

        {!loading && receipt && relation ? (
          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <ReceiptTicket
              receipt={receipt}
              companyName={config.nombreCasaRifera}
              logoDataUrl={config.logoDataUrl}
              verificationUrl={verificationUrl}
              responsableNombre={config.responsableNombre}
              responsableTelefono={config.responsableTelefono}
              responsableDireccion={config.responsableDireccion}
              responsableCiudad={config.responsableCiudad}
              responsableDepartamento={config.responsableDepartamento}
              numeroResolucionAutorizacion={config.numeroResolucionAutorizacion}
              entidadAutoriza={config.entidadAutoriza}
            />

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold uppercase text-slate-900">
                Informacion detallada
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Esta vista muestra mas detalle que el recibo tirilla para facilitar auditoria y comprobacion.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Empresa
                  </p>
                  <p className="mt-2 text-base text-slate-900">{config.nombreCasaRifera}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Rifa
                  </p>
                  <p className="mt-2 text-base text-slate-900">{relation.rifa?.nombre}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Vendedor
                  </p>
                  <p className="mt-2 text-base text-slate-900">{relation.vendedor?.nombre}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Fecha
                  </p>
                  <p className="mt-2 text-base text-slate-900">{formatDateTime(abono.fecha)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Valor abonado
                  </p>
                  <p className="mt-2 text-base text-slate-900">{formatCOP(abono.valor)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Deuda restante
                  </p>
                  <p className="mt-2 text-base text-slate-900">{formatCOP(abono.saldoDespues)}</p>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Documento del vendedor
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">
                    {relation.vendedor?.documento || 'SIN DOCUMENTO'}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Telefono del vendedor
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">
                    {relation.vendedor?.telefono || 'SIN TELEFONO'}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Deuda anterior
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{formatCOP(abono.saldoAnterior)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Boletas del vendedor en ese momento
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{abono.boletasActuales}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Descripcion
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">
                    {abono.descripcion || 'SIN DESCRIPCION'}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Codigo unico de validacion
                  </dt>
                  <dd className="mt-2 break-all text-base text-slate-900">{receipt.codigoUnico}</dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReciboPublicView;
