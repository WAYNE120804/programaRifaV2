import { EstadoBoleta } from '../../lib/prisma-client';

import { AppError } from '../../lib/app-error';

type BoletaListQueryInput = {
  rifaId?: unknown;
  rifaVendedorId?: unknown;
  estado?: unknown;
  numero?: unknown;
  vendedorNombre?: unknown;
  juega?: unknown;
};

type PublicBoletaListQueryInput = {
  rifaId?: unknown;
};

type UpdateBoletaInput = {
  estado?: unknown;
  rifaVendedorId?: unknown;
};

export type BoletaListFilters = {
  rifaId?: string;
  rifaVendedorId?: string;
  estado?: EstadoBoleta;
  numero?: string;
  vendedorNombre?: string;
  juega?: boolean;
};

export type UpdateBoletaPayload = {
  estado: EstadoBoleta;
  rifaVendedorId: string | null;
};

export type PublicBoletaListFilters = {
  rifaId: string;
};

function parseOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseEstado(value: unknown) {
  const stringValue = parseOptionalString(value);

  if (!stringValue) {
    return undefined;
  }

  if (!(stringValue in EstadoBoleta)) {
    throw new AppError('El estado de la boleta no es valido.');
  }

  return stringValue as EstadoBoleta;
}

function parseOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new AppError('El filtro "juega" no es valido.', 400);
}

export function parseBoletaListFilters(
  input: BoletaListQueryInput
): BoletaListFilters {
  return {
    rifaId: parseOptionalString(input.rifaId),
    rifaVendedorId: parseOptionalString(input.rifaVendedorId),
    estado: parseEstado(input.estado),
    numero: parseOptionalString(input.numero),
    vendedorNombre: parseOptionalString(input.vendedorNombre),
    juega: parseOptionalBoolean(input.juega),
  };
}

export function parseUpdateBoletaPayload(
  input: UpdateBoletaInput
): UpdateBoletaPayload {
  const estado = parseEstado(input.estado);

  if (!estado) {
    throw new AppError('El campo "estado" es obligatorio.');
  }

  const rifaVendedorId =
    typeof input.rifaVendedorId === 'string' && input.rifaVendedorId.trim().length > 0
      ? input.rifaVendedorId.trim()
      : null;

  return {
    estado,
    rifaVendedorId,
  };
}

export function parsePublicBoletaListFilters(
  input: PublicBoletaListQueryInput
): PublicBoletaListFilters {
  const rifaId = parseOptionalString(input.rifaId);

  if (!rifaId) {
    throw new AppError('El filtro "rifaId" es obligatorio.', 400);
  }

  return {
    rifaId,
  };
}
