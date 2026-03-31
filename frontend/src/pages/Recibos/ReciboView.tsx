import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import PrintButton from '../../components/receipts/PrintButton';
import ReceiptTicket from '../../components/receipts/ReceiptTicket';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printReceiptTicket } from '../../utils/print';

const ReciboView = () => {
  const { id } = useParams();
  const { config } = useAppConfig();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [annulReason, setAnnulReason] = useState('');
  const [annulling, setAnnulling] = useState(false);
  const [isAnnulDialogOpen, setIsAnnulDialogOpen] = useState(false);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      const { data } = await client.get(endpoints.reciboById(id));
      setReceipt(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReceipt();
  }, [id]);

  const verificationUrl = useMemo(() => {
    if (!receipt?.codigoUnico) {
      return '';
    }

    return `${window.location.origin}/verificacion/abonos/${receipt.codigoUnico}`;
  }, [receipt]);

  const abono = receipt?.abono;
  const relation = abono?.rifaVendedor;

  const handlePrint = async (copies: number) => {
    if (!receipt) {
      return;
    }

    try {
      setPrinting(true);
      await printReceiptTicket({
        companyName: config.nombreCasaRifera,
        logoDataUrl: config.logoDataUrl,
        responsableNombre: config.responsableNombre,
        responsableTelefono: config.responsableTelefono,
        responsableDireccion: config.responsableDireccion,
        responsableCiudad: config.responsableCiudad,
        responsableDepartamento: config.responsableDepartamento,
        numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
        entidadAutoriza: config.entidadAutoriza,
        verificationUrl,
        receipt,
        copies,
      });
      setIsPrintDialogOpen(false);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setPrinting(false);
    }
  };

  const handleAnnul = async () => {
    if (!receipt?.abono?.rifaVendedorId || !receipt?.abono?.id) {
      return;
    }

    try {
      setAnnulling(true);
      await client.post(
        endpoints.anularAbono(receipt.abono.rifaVendedorId, receipt.abono.id),
        { motivo: annulReason.trim() }
      );
      setIsAnnulDialogOpen(false);
      setAnnulReason('');
      await loadReceipt();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setAnnulling(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Recibo"
        actions={
          <>
            {verificationUrl ? (
              <a
                href={verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                VERIFICAR
              </a>
            ) : null}
            {!abono?.anuladoAt ? (
              <button
                type="button"
                onClick={() => setIsAnnulDialogOpen(true)}
                className="rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700"
              >
                ANULAR ABONO
              </button>
            ) : null}
            <PrintButton onClick={() => setIsPrintDialogOpen(true)} />
          </>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? <Loading label="Cargando recibo..." /> : null}
        {!loading && receipt && relation ? (
          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            {abono?.anuladoAt ? (
              <div className="xl:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <strong>ABONO ANULADO.</strong> Motivo: {abono.anuladoMotivo || 'SIN MOTIVO'}.
              </div>
            ) : null}
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

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Detalle del abono
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Este es el detalle administrativo completo que respalda el recibo impreso.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">RIFA</p>
                  <p className="theme-summary-value mt-3 text-3xl font-semibold">
                    {relation.rifa?.nombre}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">VENDEDOR</p>
                  <p className="theme-summary-value mt-3 text-3xl font-semibold">
                    {relation.vendedor?.nombre}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">VALOR</p>
                  <p className="theme-summary-value mt-3 text-3xl font-semibold">
                    {formatCOP(abono.valor)}
                  </p>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Fecha del abono
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{formatDateTime(abono.fecha)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Metodo de pago
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{abono.metodoPago}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Subcaja destino
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{abono.subCaja?.nombre || 'SIN SUBCAJA'}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Deuda anterior
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{formatCOP(abono.saldoAnterior)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Deuda restante
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{formatCOP(abono.saldoDespues)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Boletas del vendedor al momento del abono
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{abono.boletasActuales}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Codigo unico
                  </dt>
                  <dd className="mt-2 break-all text-base text-slate-900">{receipt.codigoUnico}</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Descripcion
                </p>
                <p className="mt-2 text-base text-slate-900">
                  {abono.descripcion || 'SIN DESCRIPCION'}
                </p>
              </div>

              <div className="mt-6">
                <Link
                  to="/abonos"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] text-white"
                >
                  VOLVER A ABONOS
                </Link>
              </div>
            </section>
          </div>
        ) : null}

        {isAnnulDialogOpen && receipt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-2xl font-semibold uppercase text-slate-900">
                Anular abono
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Esta accion revierte el ingreso en caja y deja el abono como anulado. No edita el registro: conserva la trazabilidad.
              </p>
              <textarea
                className="mt-4 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Motivo de anulacion"
                value={annulReason}
                onChange={(event) => setAnnulReason(event.target.value)}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={annulling}
                  onClick={() => setIsAnnulDialogOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  disabled={annulling || !annulReason.trim()}
                  onClick={() => void handleAnnul()}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  CONFIRMAR ANULACION
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isPrintDialogOpen && receipt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-2xl font-semibold uppercase text-slate-900">
                Imprimir recibo
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Elige si deseas sacar una sola tirilla o dos copias del mismo recibo. Despues se abrira el menu normal de impresion.
              </p>
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  disabled={printing}
                  onClick={() => void handlePrint(1)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-900"
                >
                  IMPRIMIR UNA COPIA
                </button>
                <button
                  type="button"
                  disabled={printing}
                  onClick={() => void handlePrint(2)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-900"
                >
                  IMPRIMIR DOS COPIAS
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={printing}
                  onClick={() => setIsPrintDialogOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReciboView;
