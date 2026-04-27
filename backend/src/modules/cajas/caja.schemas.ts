import { AppError } from '../../lib/app-error';

export type AperturaCajaPayload = {
  saldoInicial: number;
  descripcion: string | null;
};

export type CierreCajaPayload = {
  saldoReal: number;
  observaciones: string | null;
};

export type TrasladoCajaGeneralPayload = {
  cajaOrigenId: string | null;
  valor: number;
  motivo: string;
  observacion: string | null;
};

export type SalidaCajaGeneralPayload = {
  valor: number;
  motivo: string;
  observacion: string | null;
};

function parseMoney(value: unknown, fieldName: string) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`El campo "${fieldName}" debe ser un valor valido mayor o igual a cero.`);
  }

  return parsed;
}

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
  const parsed = parseMoney(value, fieldName);

  if (parsed <= 0) {
    throw new AppError(`El campo "${fieldName}" debe ser mayor a cero.`);
  }

  return parsed;
}

export function parseAperturaCajaPayload(input: Record<string, unknown>): AperturaCajaPayload {
  return {
    saldoInicial: parseMoney(input.saldoInicial, 'saldoInicial'),
    descripcion: parseOptionalString(input.descripcion),
  };
}

export function parseCierreCajaPayload(input: Record<string, unknown>): CierreCajaPayload {
  return {
    saldoReal: parseMoney(input.saldoReal, 'saldoReal'),
    observaciones: parseOptionalString(input.observaciones),
  };
}

export function parseTrasladoCajaGeneralPayload(
  input: Record<string, unknown>
): TrasladoCajaGeneralPayload {
  return {
    cajaOrigenId: parseOptionalString(input.cajaOrigenId),
    valor: parsePositiveMoney(input.valor, 'valor'),
    motivo: parseRequiredString(input.motivo, 'motivo'),
    observacion: parseOptionalString(input.observacion),
  };
}

export function parseSalidaCajaGeneralPayload(input: Record<string, unknown>): SalidaCajaGeneralPayload {
  return {
    valor: parsePositiveMoney(input.valor, 'valor'),
    motivo: parseRequiredString(input.motivo, 'motivo'),
    observacion: parseOptionalString(input.observacion),
  };
}
