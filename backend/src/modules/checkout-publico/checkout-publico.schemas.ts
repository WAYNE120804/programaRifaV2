import { AppError } from '../../lib/app-error';

type ClienteReservaInput = {
  nombre?: unknown;
  telefono?: unknown;
  documento?: unknown;
  email?: unknown;
};

type CreateReservaInput = {
  rifaId?: unknown;
  boletaIds?: unknown;
  cliente?: ClienteReservaInput;
};

type ReservaIdInput = {
  reservaId?: unknown;
};

export type ReservaCheckoutPayload = {
  rifaId: string;
  boletaIds: string[];
  cliente: {
    nombre: string;
    telefono: string;
    documento: string;
    email: string | null;
  };
};

function parseRequiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo "${field}" es obligatorio.`, 400);
  }

  return value.trim();
}

function parseOptionalEmail(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalized)) {
    throw new AppError('El email no tiene un formato valido.', 400);
  }

  return normalized;
}

export function parseReservaCheckoutPayload(input: CreateReservaInput): ReservaCheckoutPayload {
  const boletaIds = Array.isArray(input.boletaIds)
    ? input.boletaIds
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  if (!boletaIds.length) {
    throw new AppError('Debes seleccionar al menos una boleta para continuar.', 400);
  }

  if (!input.cliente || typeof input.cliente !== 'object') {
    throw new AppError('Los datos del cliente son obligatorios.', 400);
  }

  return {
    rifaId: parseRequiredString(input.rifaId, 'rifaId'),
    boletaIds,
    cliente: {
      nombre: parseRequiredString(input.cliente.nombre, 'nombre'),
      telefono: parseRequiredString(input.cliente.telefono, 'telefono'),
      documento: parseRequiredString(input.cliente.documento, 'documento'),
      email: parseOptionalEmail(input.cliente.email),
    },
  };
}

export function parseTransactionId(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError('El id de la transaccion es obligatorio.', 400);
  }

  return value.trim();
}

export function parseReservaId(input: ReservaIdInput) {
  if (typeof input.reservaId !== 'string' || !input.reservaId.trim()) {
    throw new AppError('El id de la reserva es obligatorio.', 400);
  }

  return input.reservaId.trim();
}

export type WompiEventPayload = {
  event?: unknown;
  data?: unknown;
  sent_at?: unknown;
  timestamp?: unknown;
  signature?: unknown;
};
