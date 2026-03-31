import { AppError } from '../../lib/app-error';
import { CategoriaGasto } from '../../lib/prisma-client';

type GastoInput = {
  rifaId?: unknown;
  subCajaId?: unknown;
  categoria?: unknown;
  valor?: unknown;
  fecha?: unknown;
  descripcion?: unknown;
  motivo?: unknown;
};

export type CreateGastoPayload = {
  rifaId: string;
  subCajaId?: string;
  categoria: CategoriaGasto;
  valor: number;
  fecha?: Date;
  descripcion: string;
};

export type AnularGastoPayload = {
  motivo: string;
};

const categoriaGastoValues = new Set<string>(Object.values(CategoriaGasto));

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseRequiredPositiveNumber(value: unknown, fieldName: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new AppError(`El campo "${fieldName}" debe ser un numero mayor a 0.`);
  }

  return Number(numericValue.toFixed(2));
}

function parseOptionalDate(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const rawValue = String(value).trim();
  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const now = new Date();
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );

    if (Number.isNaN(date.getTime())) {
      throw new AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
    }

    return date;
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
  }

  return date;
}

function parseCategoriaGasto(value: unknown) {
  const rawValue = typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : 'OTROS';

  if (!categoriaGastoValues.has(rawValue)) {
    throw new AppError('La categoria del gasto no es valida.');
  }

  return rawValue as CategoriaGasto;
}

export function parseCreateGastoPayload(input: GastoInput): CreateGastoPayload {
  return {
    rifaId: parseRequiredString(input.rifaId, 'rifaId'),
    subCajaId:
      typeof input.subCajaId === 'string' && input.subCajaId.trim().length > 0
        ? input.subCajaId.trim()
        : undefined,
    categoria: parseCategoriaGasto(input.categoria),
    valor: parseRequiredPositiveNumber(input.valor, 'valor'),
    fecha: parseOptionalDate(input.fecha, 'fecha'),
    descripcion: parseRequiredString(input.descripcion, 'descripcion'),
  };
}

export function parseAnularGastoPayload(
  input: Pick<GastoInput, 'motivo'>
): AnularGastoPayload {
  return {
    motivo: parseRequiredString(input.motivo, 'motivo'),
  };
}
