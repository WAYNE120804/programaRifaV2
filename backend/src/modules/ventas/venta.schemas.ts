import { MetodoPago } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';

type VentaItemInput = {
  varianteId?: unknown;
  cantidad?: unknown;
};

type VentaInput = {
  items?: unknown;
  clienteId?: unknown;
  metodoPago?: unknown;
  valorRecibido?: unknown;
  observaciones?: unknown;
};

export type VentaItemPayload = {
  varianteId: string;
  cantidad: number;
};

export type VentaPayload = {
  items: VentaItemPayload[];
  clienteId: string | null;
  metodoPago: MetodoPago;
  valorRecibido: number;
  observaciones: string | null;
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parsePositiveInt(value: unknown, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`El campo "${fieldName}" debe ser mayor que cero.`);
  }

  return Math.trunc(parsed);
}

function parseMetodoPago(value: unknown) {
  if (typeof value === 'string' && value in MetodoPago) {
    return value as MetodoPago;
  }

  throw new AppError('Debes seleccionar un metodo de pago valido.');
}

function parseOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseVentaItem(input: VentaItemInput): VentaItemPayload {
  return {
    varianteId: parseRequiredString(input.varianteId, 'varianteId'),
    cantidad: parsePositiveInt(input.cantidad, 'cantidad'),
  };
}

export function parseVentaPayload(input: VentaInput): VentaPayload {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new AppError('Debes agregar al menos una variante a la venta.');
  }

  const items = input.items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(`El item ${index + 1} de la venta no es valido.`);
    }

    return parseVentaItem(item as VentaItemInput);
  });

  const valorRecibido = Number(input.valorRecibido);

  if (!Number.isFinite(valorRecibido) || valorRecibido < 0) {
    throw new AppError('El valor recibido debe ser un numero valido.');
  }

  return {
    items,
    clienteId: parseOptionalString(input.clienteId),
    metodoPago: parseMetodoPago(input.metodoPago),
    valorRecibido,
    observaciones: parseOptionalString(input.observaciones),
  };
}
