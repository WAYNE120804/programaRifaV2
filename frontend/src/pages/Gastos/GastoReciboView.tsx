import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import PrintButton from '../../components/receipts/PrintButton';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printGastoReceiptTicket } from '../../utils/print';
import { getGastoCategoryLabel } from './gastoCategories';

const GastoReciboView = () => {
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
      const { data } = await client.get(endpoints.gastoReciboById(id));
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

  const handlePrint = async (copies: number) => {
    if (!receipt) {
      return;
    }

    try {
      setPrinting(true);
      printGastoReceiptTicket({
        companyName: config.nombreCasaRifera,
        logoDataUrl: config.logoDataUrl,
        responsableNombre: config.responsableNombre,
        responsableTelefono: config.responsableTelefono,
        responsableDireccion: config.responsableDireccion,
        responsableCiudad: config.responsableCiudad,
        responsableDepartamento: config.responsableDepartamento,
        numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
        entidadAutoriza: config.entidadAutoriza,
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
    if (!receipt?.gasto?.id) {
      return;
    }

    try {
      setAnnulling(true);
      await client.post(endpoints.anularGasto(receipt.gasto.id), {
        motivo: annulReason.trim(),
      });
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
        title="Recibo de gasto"
        actions={
          <>
            <Link
              to="/gastos"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              VOLVER A GASTOS
            </Link>
            {!receipt?.gasto?.anuladoAt ? (
              <button
                type="button"
                onClick={() => setIsAnnulDialogOpen(true)}
                className="rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700"
              >
                ANULAR GASTO
              </button>
            ) : null}
            <PrintButton onClick={() => setIsPrintDialogOpen(true)} />
          </>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? <Loading label="Cargando recibo..." /> : null}

        {!loading && receipt ? (
          <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            {receipt.gasto?.anuladoAt ? (
              <div className="xl:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <strong>GASTO ANULADO.</strong> Motivo: {receipt.gasto.anuladoMotivo || 'SIN MOTIVO'}.
              </div>
            ) : null}
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-lg">
              <div className="text-center">
                {config.logoDataUrl ? (
                  <img
                    src={config.logoDataUrl}
                    alt={config.nombreCasaRifera}
                    className="mx-auto h-20 w-20 rounded-full border border-slate-200 object-contain p-2"
                  />
                ) : null}
                <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-slate-500">Casa rifera</p>
                <h1 className="mt-2 text-xl font-bold uppercase">{config.nombreCasaRifera}</h1>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Recibo de gasto</p>
              </div>

              <div className="my-4 border-t border-dashed border-slate-300" />
              <div className="space-y-1.5 text-center text-sm">
                <p><span className="font-semibold">Responsable:</span> {config.responsableNombre || 'SIN RESPONSABLE'}</p>
                <p><span className="font-semibold">Telefono:</span> {config.responsableTelefono || 'SIN TELEFONO'}</p>
                <p><span className="font-semibold">Autoriza:</span> {config.entidadAutoriza || 'SIN ENTIDAD'}</p>
                <p><span className="font-semibold">Resolucion:</span> {config.numeroResolucionAutorizacion || 'SIN RESOLUCION'}</p>
              </div>

              <div className="my-4 border-t border-dashed border-slate-300" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3"><span className="font-semibold">Rifa</span><span>{receipt.gasto.rifa?.nombre}</span></div>
                <div className="flex justify-between gap-3"><span className="font-semibold">Consecutivo</span><span>GST-{String(receipt.consecutivo).padStart(6, '0')}</span></div>
                <div className="flex justify-between gap-3"><span className="font-semibold">Codigo</span><span className="text-right">{receipt.codigoUnico}</span></div>
                <div className="flex justify-between gap-3"><span className="font-semibold">Fecha</span><span className="text-right">{formatDateTime(receipt.fecha)}</span></div>
                <div className="flex justify-between gap-3"><span className="font-semibold">Categoria</span><span className="text-right">{getGastoCategoryLabel(receipt.gasto.categoria)}</span></div>
                <div className="flex justify-between gap-3"><span className="font-semibold">Subcaja</span><span className="text-right">{receipt.gasto.subCaja?.nombre || 'SIN SUBCAJA'}</span></div>
                <div className="flex justify-between gap-3"><span className="font-semibold">Valor</span><span>{formatCOP(receipt.gasto.valor)}</span></div>
                <div className="flex justify-between gap-3"><span className="font-semibold">Registrado por</span><span className="text-right">{receipt.gasto.usuario?.nombre || 'SISTEMA'}</span></div>
              </div>

              <div className="my-4 border-t border-dashed border-slate-300" />
              <div className="rounded-xl bg-slate-50 p-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Descripcion</p>
                <p className="mt-1 leading-relaxed">{receipt.gasto.descripcion}</p>
              </div>
            </section>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Detalle del gasto
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Este gasto ya quedo registrado con su recibo interno tipo tirilla.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">RIFA</p>
                  <p className="theme-summary-value mt-3 text-3xl font-semibold">
                    {receipt.gasto.rifa?.nombre}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">VALOR</p>
                  <p className="theme-summary-value mt-3 text-3xl font-semibold">
                    {formatCOP(receipt.gasto.valor)}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">CATEGORIA</p>
                  <p className="theme-summary-value mt-3 text-xl font-semibold">
                    {getGastoCategoryLabel(receipt.gasto.categoria)}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">SUBCAJA</p>
                  <p className="theme-summary-value mt-3 text-xl font-semibold">
                    {receipt.gasto.subCaja?.nombre || 'SIN SUBCAJA'}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">CODIGO</p>
                  <p className="theme-summary-value mt-3 text-xl font-semibold">
                    {receipt.codigoUnico}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">REGISTRADO POR</p>
                  <p className="theme-summary-value mt-3 text-xl font-semibold">
                    {receipt.gasto.usuario?.nombre || 'SISTEMA'}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Descripcion</p>
                <p className="mt-2 text-base text-slate-900">{receipt.gasto.descripcion}</p>
              </div>
            </section>
          </div>
        ) : null}

        {isAnnulDialogOpen && receipt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-2xl font-semibold uppercase text-slate-900">
                Anular gasto
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Esta accion revierte la salida de caja y deja el gasto marcado como anulado para conservar el historial.
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
                Imprimir recibo de gasto
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

export default GastoReciboView;
