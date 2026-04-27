import { CategoriaGasto, OrigenGasto } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';

export type GastoPayload = {
  origen: OrigenGasto;
  fondoId: string | null;
  categoria: CategoriaGasto;
  descripcion: string;
  valor: number;
  soporte: string | null;
  observacion: string | null;
};

function parseOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseRequiredString(value: unknown, fieldName: string) {
  const parsed = parseOptionalString(value);

  if (!parsed) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return parsed;
}

function parsePositiveMoney(value: unknown, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`El campo "${fieldName}" debe ser mayor a cero.`);
  }

  return parsed;
}

function parseOrigen(value: unknown) {
  if (typeof value === 'string' && value in OrigenGasto) {
    return value as OrigenGasto;
  }

  throw new AppError('Debes seleccionar un origen valido para el pago.');
}

function parseCategoria(value: unknown) {
  if (typeof value === 'string' && value in CategoriaGasto) {
    return value as CategoriaGasto;
  }

  throw new AppError('Debes seleccionar un concepto valido para el gasto.');
}

export function parseGastoPayload(input: Record<string, unknown>): GastoPayload {
  const origen = parseOrigen(input.origen);
  const fondoId = parseOptionalString(input.fondoId);

  if (origen === OrigenGasto.FONDO_META && !fondoId) {
    throw new AppError('Debes seleccionar el fondo/meta origen del pago.');
  }

  return {
    origen,
    fondoId,
    categoria: parseCategoria(input.categoria),
    descripcion: parseRequiredString(input.descripcion, 'descripcion'),
    valor: parsePositiveMoney(input.valor, 'valor'),
    soporte: parseOptionalString(input.soporte),
    observacion: parseOptionalString(input.observacion),
  };
}
