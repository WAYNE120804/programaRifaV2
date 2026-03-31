import { AppError } from '../../lib/app-error';

type RifaVendedorInput = {
  rifaId?: unknown;
  vendedorId?: unknown;
  comisionPct?: unknown;
};

type AsignacionInput = {
  metodo?: unknown;
  cantidad?: unknown;
  numeroDesde?: unknown;
  numeroHasta?: unknown;
  listaNumeros?: unknown;
  permitirParcial?: unknown;
};

type DevolucionInput = {
  metodo?: unknown;
  listaNumeros?: unknown;
  permitirParcial?: unknown;
  destino?: unknown;
};

export type RifaVendedorPayload = {
  rifaId: string;
  vendedorId: string;
  comisionPct: number;
};

export type UpdateRifaVendedorPayload = {
  comisionPct: number;
};

export type AsignacionMetodo = 'ALEATORIA' | 'RANGO' | 'LISTA';

export type CreateAsignacionPayload = {
  metodo: AsignacionMetodo;
  cantidad?: number;
  numeroDesde?: string;
  numeroHasta?: string;
  listaNumeros?: string;
  permitirParcial?: boolean;
};

export type DevolucionMetodo = 'TODAS' | 'LISTA';

export type CreateDevolucionPayload = {
  metodo: DevolucionMetodo;
  listaNumeros?: string;
  permitirParcial?: boolean;
  destino: 'DISPONIBLE' | 'FUERA_CIRCULACION';
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseNumberField(value: unknown, fieldName: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new AppError(`El campo "${fieldName}" debe ser un numero valido.`);
  }

  return numberValue;
}

export function parseRifaVendedorPayload(
  input: RifaVendedorInput
): RifaVendedorPayload {
  const rifaId = parseRequiredString(input.rifaId, 'rifaId');
  const vendedorId = parseRequiredString(input.vendedorId, 'vendedorId');
  const comisionPct = parseNumberField(input.comisionPct, 'comisionPct');

  if (comisionPct > 100) {
    throw new AppError('El campo "comisionPct" no puede ser mayor a 100.');
  }

  return {
    rifaId,
    vendedorId,
    comisionPct,
  };
}

export function parseRifaVendedorUpdatePayload(
  input: Pick<RifaVendedorInput, 'comisionPct'>
): UpdateRifaVendedorPayload {
  const comisionPct = parseNumberField(input.comisionPct, 'comisionPct');

  if (comisionPct > 100) {
    throw new AppError('El campo "comisionPct" no puede ser mayor a 100.');
  }

  return {
    comisionPct,
  };
}

export function parseCreateAsignacionPayload(
  input: AsignacionInput
): CreateAsignacionPayload {
  if (typeof input.metodo !== 'string') {
    throw new AppError('El campo "metodo" es obligatorio.');
  }

  const metodo = input.metodo.trim().toUpperCase() as AsignacionMetodo;

  if (!['ALEATORIA', 'RANGO', 'LISTA'].includes(metodo)) {
    throw new AppError('El metodo de asignacion no es valido.');
  }

  if (metodo === 'ALEATORIA') {
    const cantidad = Number(input.cantidad);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new AppError(
        'Para asignacion aleatoria debes enviar una cantidad entera mayor que 0.'
      );
    }

    return {
      metodo,
      cantidad,
      permitirParcial: Boolean(input.permitirParcial),
    };
  }

  if (metodo === 'RANGO') {
    const numeroDesde = parseRequiredString(input.numeroDesde, 'numeroDesde');
    const numeroHasta = parseRequiredString(input.numeroHasta, 'numeroHasta');

    return {
      metodo,
      numeroDesde,
      numeroHasta,
      permitirParcial: Boolean(input.permitirParcial),
    };
  }

  const listaNumeros = parseRequiredString(input.listaNumeros, 'listaNumeros');

  return {
    metodo,
    listaNumeros,
    permitirParcial: Boolean(input.permitirParcial),
  };
}

export function parseCreateDevolucionPayload(
  input: DevolucionInput
): CreateDevolucionPayload {
  if (typeof input.metodo !== 'string') {
    throw new AppError('El campo "metodo" es obligatorio.');
  }

  const metodo = input.metodo.trim().toUpperCase() as DevolucionMetodo;

  if (!['TODAS', 'LISTA'].includes(metodo)) {
    throw new AppError('El metodo de devolucion no es valido.');
  }

  if (metodo === 'TODAS') {
    return {
      metodo,
      permitirParcial: Boolean(input.permitirParcial),
      destino:
        typeof input.destino === 'string' && input.destino.trim() === 'FUERA_CIRCULACION'
          ? 'FUERA_CIRCULACION'
          : 'DISPONIBLE',
    };
  }

  return {
    metodo,
    listaNumeros: parseRequiredString(input.listaNumeros, 'listaNumeros'),
    permitirParcial: Boolean(input.permitirParcial),
    destino:
      typeof input.destino === 'string' && input.destino.trim() === 'FUERA_CIRCULACION'
        ? 'FUERA_CIRCULACION'
        : 'DISPONIBLE',
  };
}
