import { AppError } from '../../lib/app-error';

type SubCajaInput = {
  rifaId?: unknown;
  nombre?: unknown;
};

export type CreateSubCajaPayload = {
  rifaId: string;
  nombre: string;
};

export type PrepareWebChannelPayload = {
  rifaId: string;
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

export function parseCreateSubCajaPayload(input: SubCajaInput): CreateSubCajaPayload {
  return {
    rifaId: parseRequiredString(input.rifaId, 'rifaId'),
    nombre: parseRequiredString(input.nombre, 'nombre'),
  };
}

export function parsePrepareWebChannelPayload(input: { rifaId?: unknown }): PrepareWebChannelPayload {
  return {
    rifaId: parseRequiredString(input.rifaId, 'rifaId'),
  };
}
