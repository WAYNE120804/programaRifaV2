import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatCOP } from '../../utils/money';

const GENERIC_CUSTOMER_DOCUMENT = '2222222';

const formatVariantDetail = (variant: {
  color?: string | null;
  talla?: string | null;
}) => {
  const color = String(variant.color || '').toUpperCase();
  const talla = String(variant.talla || '').toUpperCase();

  if (color === 'NO APLICA' && talla === 'NO APLICA') {
    return 'Sin color ni talla';
  }

  if (color === 'NO APLICA') {
    return `Talla ${variant.talla}`;
  }

  if (talla === 'NO APLICA') {
    return `Color ${variant.color}`;
  }

  return `${variant.color}/${variant.talla}`;
};

const getPaymentLabel = (value?: string | null) => {
  const labels: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    NEQUI: 'Nequi',
    DAVIPLATA: 'Daviplata',
    TRANSFERENCIA: 'Transferencia',
    TARJETA: 'Tarjeta',
    OTRO: 'Otro',
  };

  return labels[String(value || '')] || value || 'N/A';
};

const getReceivedValue = (venta: any) => {
  const payment = venta?.pagos?.[0];
  const observation = String(payment?.observacion || '');
  const match = observation.match(/Valor recibido:\s*([\d.]+)/i);

  if (match) {
    return Number(match[1]);
  }

  return Number(venta?.totalPagado || venta?.total || 0);
};

const VentaTicketPage = () => {
  const { id } = useParams();
  const { config } = useAppConfig();
  const [venta, setVenta] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVenta = async () => {
      try {
        if (!id) {
          throw new Error('No se encontro el identificador de la venta.');
        }

        const { data } = await client.get(endpoints.ventaById(id));
        setVenta(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadVenta();
  }, [id]);

  const totals = useMemo(() => {
    const received = getReceivedValue(venta);
    const total = Number(venta?.total || 0);

    return {
      subtotal: Number(venta?.subtotal || total),
      total,
      received,
      change: Math.max(0, received - total),
      utilidad: Number(venta?.utilidadTotal || 0),
    };
  }, [venta]);

  return (
    <div>
      <Topbar title="Tirilla de venta" />
      <div className="px-6 py-6">
        <div className="no-print mb-5 flex flex-wrap gap-3">
          <Link
            to="/ventas"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
          >
            Volver a ventas
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
        ) : venta ? (
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
                <span>Venta</span>
                <strong>#{venta.numero}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Fecha</span>
                <span className="text-right">{new Date(venta.createdAt).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Cajero</span>
                <span className="text-right">{venta.usuario?.nombre || 'N/A'}</span>
              </div>
              <div className="mt-2">
                <p className="font-bold">Cliente</p>
                <p>{venta.cliente?.nombreCompleto || 'CLIENTE GENERAL'}</p>
                <p>Cedula: {venta.cliente?.cedula || GENERIC_CUSTOMER_DOCUMENT}</p>
              </div>
            </section>

            <section className="border-b border-dashed border-slate-300 py-3">
              <div className="mb-2 grid grid-cols-[1fr_34px_72px] gap-2 text-[11px] font-bold uppercase">
                <span>Producto</span>
                <span className="text-right">Cant</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-2">
                {venta.items?.map((item: any) => {
                  const barcode =
                    item.variante?.codigos?.find((code: any) => code.principal)?.codigo ||
                    item.variante?.codigos?.[0]?.codigo ||
                    null;

                  return (
                    <div key={item.id}>
                      <div className="grid grid-cols-[1fr_34px_72px] gap-2">
                        <div>
                          <p className="font-bold">{item.variante?.producto?.nombre || 'Producto'}</p>
                          <p className="text-[11px]">
                            {formatVariantDetail(item.variante || {})}
                            {item.variante?.sku ? ` | SKU ${item.variante.sku}` : ''}
                          </p>
                          {barcode ? <p className="text-[11px]">Cod: {barcode}</p> : null}
                          <p className="text-[11px]">Vr unit: {formatCOP(item.precioUnitario)}</p>
                        </div>
                        <span className="text-right">{item.cantidad}</span>
                        <span className="text-right">{formatCOP(item.subtotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border-b border-dashed border-slate-300 py-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCOP(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>{formatCOP(totals.total)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Metodo</span>
                <span>{getPaymentLabel(venta.pagos?.[0]?.metodo)}</span>
              </div>
              <div className="flex justify-between">
                <span>Recibido</span>
                <span>{formatCOP(totals.received)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cambio</span>
                <span>{formatCOP(totals.change)}</span>
              </div>
            </section>

            {venta.observaciones ? (
              <section className="border-b border-dashed border-slate-300 py-3">
                <p className="font-bold">Observaciones</p>
                <p>{venta.observaciones}</p>
              </section>
            ) : null}

            <footer className="pt-3 text-center">
              {config.notasRecibo ? <p>{config.notasRecibo}</p> : <p>Gracias por su compra.</p>}
              <p className="mt-2 text-[10px]">Sistema administrativo de almacen</p>
            </footer>
          </article>
        ) : null}
      </div>
    </div>
  );
};

export default VentaTicketPage;
