import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

type ReceiptTicketProps = {
  receipt: any;
  companyName: string;
  logoDataUrl?: string | null;
  verificationUrl: string;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
};

const ReceiptTicket = ({
  receipt,
  companyName,
  logoDataUrl,
  verificationUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
}: ReceiptTicketProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    const generateQr = async () => {
      if (!verificationUrl) {
        setQrCodeDataUrl('');
        return;
      }

      const nextQr = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 180,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      });

      setQrCodeDataUrl(nextQr);
    };

    void generateQr();
  }, [verificationUrl]);

  if (!receipt?.abono?.rifaVendedor) {
    return null;
  }

  const abono = receipt.abono;
  const relation = abono.rifaVendedor;
  const vendedor = relation.vendedor;
  const rifa = relation.rifa;

  return (
    <div className="receipt-ticket mx-auto w-full max-w-sm rounded-2xl bg-white p-5 text-[12px] text-slate-900 shadow-lg">
      <div className="text-center">
        {logoDataUrl ? (
          <img
            src={logoDataUrl}
            alt={companyName}
            className="mx-auto h-20 w-20 rounded-full border border-slate-200 object-contain p-2"
          />
        ) : null}
        <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-slate-500">Casa rifera</p>
        <h1 className="mt-2 text-xl font-bold uppercase">{companyName}</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Recibo de abono</p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1.5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Responsable y autorizacion
        </p>
        <p className="text-center">
          <span className="font-semibold">Responsable:</span> {responsableNombre || 'SIN RESPONSABLE'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Tel. responsable:</span> {responsableTelefono || 'SIN TELEFONO'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Ubicacion:</span>{' '}
          {[responsableDireccion, responsableCiudad, responsableDepartamento]
            .filter(Boolean)
            .join(' - ') || 'SIN UBICACION'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Autoriza:</span> {entidadAutoriza || 'SIN ENTIDAD'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Resolucion:</span>{' '}
          {numeroResolucionAutorizacion || 'SIN RESOLUCION'}
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1.5">
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Rifa</span>
          <span className="text-right">{rifa.nombre}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Consecutivo</span>
          <span>ABN-{String(receipt.consecutivo).padStart(6, '0')}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Codigo</span>
          <span className="text-right">{receipt.codigoUnico}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Fecha</span>
          <span className="text-right">{formatDateTime(receipt.fecha)}</span>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1.5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Vendedor
        </p>
        <p className="text-center text-lg font-semibold uppercase">{vendedor.nombre}</p>
        <p className="text-center">
          <span className="font-semibold">Cedula:</span> {vendedor.documento || 'SIN DOCUMENTO'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Telefono:</span> {vendedor.telefono || 'SIN TELEFONO'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Direccion:</span> {vendedor.direccion || 'SIN DIRECCION'}
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-2">
        <div className="flex justify-between gap-3">
          <span>Valor abonado</span>
          <span className="font-semibold">{formatCOP(abono.valor)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Deuda anterior</span>
          <span>{formatCOP(abono.saldoAnterior)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Deuda restante</span>
          <span>{formatCOP(abono.saldoDespues)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Boletas actuales</span>
          <span>{abono.boletasActuales}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Metodo de pago</span>
          <span>{abono.metodoPago}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Registrado por</span>
          <span>{abono.usuario?.nombre || 'SISTEMA'}</span>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Descripcion
          </p>
          <p className="mt-1 leading-relaxed">{abono.descripcion || 'SIN DESCRIPCION'}</p>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Verificacion
        </p>
        {qrCodeDataUrl ? (
          <img src={qrCodeDataUrl} alt="QR del recibo" className="mx-auto mt-3 h-36 w-36" />
        ) : null}
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Escanea este codigo para confirmar que el recibo es real y revisar el detalle completo del abono.
        </p>
      </div>
    </div>
  );
};

export default ReceiptTicket;
