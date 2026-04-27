import { AppError } from '../../lib/app-error';

type ClienteInput = {
  nombreCompleto?: unknown;
  cedula?: unknown;
  telefonoCelular?: unknown;
  email?: unknown;
  fechaNacimiento?: unknown;
  observaciones?: unknown;
};

export type ClientePayload = {
  nombreCompleto: string;
  cedula: string;
  telefonoCelular: string;
  email: string | null;
  fechaNacimiento: Date | null;
  observaciones: string | null;
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

function parseDocument(value: unknown, fieldName: string) {
  const normalized = parseRequiredString(value, fieldName).replace(/\s+/g, '');

  if (!/^[0-9A-Za-z.-]+$/.test(normalized)) {
    throw new AppError(`El campo "${fieldName}" contiene caracteres no permitidos.`);
  }

  return normalized;
}

function parsePhone(value: unknown, fieldName: string) {
  const normalized = parseRequiredString(value, fieldName).replace(/[^\d+]/g, '');

  if (normalized.length < 7) {
    throw new AppError(`El campo "${fieldName}" debe tener al menos 7 digitos.`);
  }

  return normalized;
}

function parseEmail(value: unknown) {
  const normalized = parseOptionalString(value);

  if (!normalized) {
    return null;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalized)) {
    throw new AppError('El correo electronico no es valido.');
  }

  return normalized.toLowerCase();
}

function parseBirthDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError('La fecha de nacimiento debe tener formato YYYY-MM-DD.');
  }

  const date = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new AppError('La fecha de nacimiento no es valida.');
  }

  return date;
}

export function parseClientePayload(input: ClienteInput): ClientePayload {
  return {
    nombreCompleto: parseRequiredString(input.nombreCompleto, 'nombreCompleto'),
    cedula: parseDocument(input.cedula, 'cedula'),
    telefonoCelular: parsePhone(input.telefonoCelular, 'telefonoCelular'),
    email: parseEmail(input.email),
    fechaNacimiento: parseBirthDate(input.fechaNacimiento),
    observaciones: parseOptionalString(input.observaciones),
  };
}
