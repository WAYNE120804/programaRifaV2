import { AppError } from '../../lib/app-error';

type CategoriaInput = {
  nombre?: unknown;
  codigo?: unknown;
  descripcion?: unknown;
  activa?: unknown;
  orden?: unknown;
};

export type CategoriaPayload = {
  nombre: string;
  codigo: string;
  descripcion: string | null;
  activa: boolean;
  orden: number;
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseCategoriaCodigo(value: unknown) {
  if (typeof value !== 'string') {
    throw new AppError('El campo "codigo" es obligatorio.');
  }

  const normalized = value.trim().replace(/\D+/g, '');

  if (normalized.length === 0 || normalized.length > 2) {
    throw new AppError('El codigo de categoria debe tener 1 o 2 digitos.');
  }

  return normalized.padStart(2, '0');
}

function parseBoolean(value: unknown, defaultValue = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return defaultValue;
}

function parseNumberValue(value: unknown, fieldName: string, defaultValue = 0) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new AppError(`El campo "${fieldName}" debe ser numerico.`);
  }

  return Math.trunc(parsed);
}

export function parseCategoriaPayload(input: CategoriaInput): CategoriaPayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    codigo: parseCategoriaCodigo(input.codigo),
    descripcion: parseOptionalString(input.descripcion),
    activa: parseBoolean(input.activa, true),
    orden: parseNumberValue(input.orden, 'orden', 0),
  };
}
