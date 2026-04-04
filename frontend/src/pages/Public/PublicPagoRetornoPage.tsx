import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import { formatDateTimeLong } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import PublicNavbar from './PublicNavbar';

type ReservaEstadoResponse = {
  id: string;
  reference: string | null;
  estadoVenta: string;
  paymentState: string;
  paymentTransactionId: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  total: number | string;
  cliente: {
    nombre: string;
    email: string | null;
    telefono: string | null;
  };
  boletas: Array<{
    id: string;
    numero: string;
    estado: string;
    reservadaHasta: string | null;
  }>;
};

const FINAL_PAYMENT_STATES = new Set(['APPROVED', 'DECLINED', 'VOIDED', 'ERROR']);

const PublicPagoRetornoPage = () => {
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('id');
  const reservaId = searchParams.get('reserva');
  const referencia = searchParams.get('referencia');
  const rifaId = searchParams.get('rifa');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservaEstado, setReservaEstado] = useState<ReservaEstadoResponse | null>(null);

  useEffect(() => {
    if (!reservaId) {
      setLoading(false);
      setError('No se recibio la reserva en el retorno del pago.');
      return;
    }

    let active = true;
    let timer: number | null = null;
    let reconciled = false;

    const loadEstado = async () => {
      try {
        if (transactionId && !reconciled) {
          reconciled = true;
          await client.post(endpoints.checkoutPublicoReservaWompiReconcile(reservaId), {
            transactionId,
          });
        }

        const { data } = await client.get<ReservaEstadoResponse>(
          endpoints.checkoutPublicoReservaById(reservaId)
        );

        if (!active) {
          return;
        }

        setReservaEstado(data);
        setError(null);

        if (!FINAL_PAYMENT_STATES.has(data.paymentState) && !data.isExpired) {
          timer = window.setTimeout(() => {
            void loadEstado();
          }, 4000);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError((requestError as Error).message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEstado();

    return () => {
      active = false;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [reservaId, transactionId]);

  const paymentState = reservaEstado?.paymentState || 'PENDING';
  const isApproved = paymentState === 'APPROVED';
  const isRejected = paymentState === 'DECLINED' || paymentState === 'VOIDED' || paymentState === 'ERROR';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar showBackHome ctaHref="/publico" />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <section className="rounded-[2.2rem] border bg-white p-8 shadow-sm md:p-12">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Retorno de Wompi</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900">
            {isApproved
              ? 'Wompi reporto tu pago como aprobado'
              : isRejected
                ? 'Wompi reporto que el pago no fue aprobado'
                : 'Estamos validando tu pago'}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
            {isApproved
              ? 'La reserva ya fue convertida en venta pagada y las boletas quedaron asignadas a este comprador.'
              : isRejected
                ? 'La reserva ya fue cerrada como no aprobada y las boletas fueron liberadas nuevamente.'
                : 'Ya regresaste desde Wompi. Esta pantalla consulta el estado real de la reserva hasta recibir un estado final desde el webhook.'}
          </p>

          {loading ? <div className="mt-8"><Loading label="Consultando estado de la reserva..." /></div> : null}
          {error ? <div className="mt-8"><ErrorBanner message={error} /></div> : null}

          {reservaEstado ? (
            <div className="mt-8 grid gap-5">
              {isApproved ? (
                <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                  <p className="text-xs font-bold uppercase tracking-[0.24em]">Pago confirmado</p>
                  <h2 className="mt-2 text-3xl font-black">Tu pago ya fue registrado</h2>
                  <p className="mt-3 text-base leading-7">
                    Tus boletas ya quedaron registradas a nombre de {reservaEstado.cliente.nombre}.
                  </p>
                </div>
              ) : null}

              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-500">Estado actual</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{reservaEstado.paymentState}</p>
                <p className="mt-3 text-sm text-slate-600">
                  Reserva: {reservaEstado.reference || referencia || reservaEstado.id}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Transaccion Wompi: {reservaEstado.paymentTransactionId || transactionId || 'Pendiente'}
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-500">Boletas</p>
                <p className="mt-2 text-lg font-black text-slate-900">
                  {reservaEstado.boletas.map((boleta) => boleta.numero).join(', ')}
                </p>
                <p className="mt-4 text-sm text-slate-600">Total reservado</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{formatCOP(reservaEstado.total)}</p>
                <p className="mt-4 text-sm text-slate-600">
                  Expira: {reservaEstado.expiresAt ? formatDateTimeLong(reservaEstado.expiresAt) : 'Sin fecha'}
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-500">Datos del comprador</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Nombre</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{reservaEstado.cliente.nombre}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Telefono</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{reservaEstado.cliente.telefono || 'No registrado'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{reservaEstado.cliente.email || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-500">Detalle de boletas</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {reservaEstado.boletas.map((boleta) => (
                    <div key={boleta.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Boleta</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{boleta.numero}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Estado</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{boleta.estado}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {rifaId ? (
              <Link
                to={`/publico/rifas/${rifaId}`}
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Volver a la rifa
              </Link>
            ) : null}
            <Link
              to="/publico"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              Volver al inicio publico
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicPagoRetornoPage;
