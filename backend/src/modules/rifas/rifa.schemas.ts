import { EstadoRifa } from '../../lib/prisma-client';

import { AppError } from '../../lib/app-error';

type RifaInput = {
  nombre?: unknown;
  loteriaNombre?: unknown;
  numeroCifras?: unknown;
  fechaInicio?: unknown;
  fechaFin?: unknown;
  precioBoleta?: unknown;
  estado?: unknown;
};

export type RifaPayload = {
  nombre: string;
  loteriaNombre: string;
  numeroCifras: number;
  fechaInicio: Date;
  fechaFin: Date;
  precioBoleta: number;
  estado: EstadoRifa;
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseDate(value: unknown, fieldName: string) {
  const stringValue = parseRequiredString(value, fieldName);
  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
  }

  return date;
}

function parsePrice(value: unknown) {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    throw new AppError('El campo "precioBoleta" debe ser un numero mayor que 0.');
  }

  return price;
}

function parseNumeroCifras(value: unknown) {
  const numeroCifras = Number(value);

  if (![2, 3, 4].includes(numeroCifras)) {
    throw new AppError('El campo "numeroCifras" debe ser 2, 3 o 4.');
  }

  return numeroCifras;
}

function parseEstado(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return EstadoRifa.BORRADOR;
  }

  if (typeof value !== 'string' || !(value in EstadoRifa)) {
    throw new AppError('El campo "estado" no es valido.');
  }

  return value as EstadoRifa;
}

export function parseRifaPayload(input: RifaInput): RifaPayload {
  const nombre = parseRequiredString(input.nombre, 'nombre');
  const loteriaNombre = parseRequiredString(input.loteriaNombre, 'loteriaNombre');
  const numeroCifras = parseNumeroCifras(input.numeroCifras);
  const fechaInicio = parseDate(input.fechaInicio, 'fechaInicio');
  const fechaFin = parseDate(input.fechaFin, 'fechaFin');
  const precioBoleta = parsePrice(input.precioBoleta);
  const estado = parseEstado(input.estado);

  if (fechaFin < fechaInicio) {
    throw new AppError('La fecha de fin no puede ser menor que la fecha de inicio.');
  }

  return {
    nombre,
    loteriaNombre,
    numeroCifras,
    fechaInicio,
    fechaFin,
    precioBoleta,
    estado,
  };
}
