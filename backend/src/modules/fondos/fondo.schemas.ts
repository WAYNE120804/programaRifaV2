import { OrigenApartadoFondo } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';

export type UpsertFondoPayload = {
  nombre: string;
  metaTotal: number;
  notas: string | null;
  activo: boolean;
};

export type ApartadoFondoPayload = {
  fondoId: string;
  origen: OrigenApartadoFondo;
  valor: number;
  observacion: string | null;
};

export type DeleteFondoPayload = {
  destino: OrigenApartadoFondo | null;
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

function parseMoney(value: unknown, fieldName: string) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`El campo "${fieldName}" debe ser un valor valido mayor o igual a cero.`);
  }

  return parsed;
}

function parsePositiveMoney(value: unknown, fieldName: string) {
  const parsed = parseMoney(value, fieldName);

  if (parsed <= 0) {
    throw new AppError(`El campo "${fieldName}" debe ser mayor a cero.`);
  }

  return parsed;
}

function parseBoolean(value: unknown, defaultValue = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  return defaultValue;
}

function parseOrigen(value: unknown) {
  if (value === OrigenApartadoFondo.CAJA_DIARIA || value === OrigenApartadoFondo.CAJA_GENERAL) {
    return value;
  }

  throw new AppError('Debes seleccionar una caja origen valida.');
}

export function parseUpsertFondoPayload(input: Record<string, unknown>): UpsertFondoPayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    metaTotal: parseMoney(input.metaTotal, 'metaTotal'),
    notas: parseOptionalString(input.notas),
    activo: parseBoolean(input.activo, true),
  };
}

export function parseApartadoFondoPayload(input: Record<string, unknown>): ApartadoFondoPayload {
  return {
    fondoId: parseRequiredString(input.fondoId, 'fondoId'),
    origen: parseOrigen(input.origen),
    valor: parsePositiveMoney(input.valor, 'valor'),
    observacion: parseOptionalString(input.observacion),
  };
}

export function parseDeleteFondoPayload(input: Record<string, unknown>): DeleteFondoPayload {
  return {
    destino: input.destino == null || input.destino === '' ? null : parseOrigen(input.destino),
    observacion: parseOptionalString(input.observacion),
  };
}
