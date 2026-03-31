import { AppError } from '../../lib/app-error';

type VendedorInput = {
  nombre?: unknown;
  telefono?: unknown;
  documento?: unknown;
  direccion?: unknown;
};

export type VendedorPayload = {
  nombre: string;
  telefono: string | null;
  documento: string | null;
  direccion: string | null;
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError('Los campos opcionales deben ser texto.');
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

export function parseVendedorPayload(input: VendedorInput): VendedorPayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    telefono: parseOptionalString(input.telefono),
    documento: parseOptionalString(input.documento),
    direccion: parseOptionalString(input.direccion),
  };
}
