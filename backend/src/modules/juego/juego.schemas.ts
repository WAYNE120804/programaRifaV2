import { AppError } from '../../lib/app-error';

type JuegoListQueryInput = {
  rifaId?: unknown;
  premioId?: unknown;
  rifaVendedorId?: unknown;
  numero?: unknown;
};

type ActualizarJuegoInput = {
  premioId?: unknown;
  modo?: unknown;
  numeros?: unknown;
};

export type JuegoListFilters = {
  rifaId: string;
  premioId: string;
  rifaVendedorId?: string;
  numero?: string;
};

export type ActualizarJuegoPayload = {
  premioId: string;
  modo: 'LISTA' | 'TODAS' | 'NINGUNA';
  numeros: string[];
};

function parseOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseJuegoListFilters(input: JuegoListQueryInput): JuegoListFilters {
  const rifaId = parseOptionalString(input.rifaId);
  const premioId = parseOptionalString(input.premioId);

  if (!rifaId) {
    throw new AppError('La rifa es obligatoria para consultar el juego.', 400);
  }

  if (!premioId) {
    throw new AppError('El premio es obligatorio para consultar el juego.', 400);
  }

  return {
    rifaId,
    premioId,
    rifaVendedorId: parseOptionalString(input.rifaVendedorId),
    numero: parseOptionalString(input.numero),
  };
}

export function parseActualizarJuegoPayload(
  input: ActualizarJuegoInput
): ActualizarJuegoPayload {
  const premioId = parseOptionalString(input.premioId);
  const modo = parseOptionalString(input.modo)?.toUpperCase();

  if (!premioId) {
    throw new AppError('El premio es obligatorio para actualizar el juego.', 400);
  }

  if (!modo || !['LISTA', 'TODAS', 'NINGUNA'].includes(modo)) {
    throw new AppError('El modo de juego no es valido.', 400);
  }

  const numeros =
    Array.isArray(input.numeros)
      ? input.numeros
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
      : [];

  if (modo === 'LISTA' && numeros.length === 0) {
    throw new AppError('Debes enviar al menos una boleta para marcar juego por lista.', 400);
  }

  return {
    premioId,
    modo: modo as ActualizarJuegoPayload['modo'],
    numeros,
  };
}
