import { AppError } from '../../lib/app-error';

type PremioInput = {
  rifaId?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  imagenes?: unknown;
  tipo?: unknown;
  mostrarValor?: unknown;
  valor?: unknown;
  fecha?: unknown;
};

type PremioBoletasInput = {
  numeros?: unknown;
};

export type PremioPayload = {
  rifaId: string;
  nombre: string;
  descripcion: string | null;
  imagenes: Array<{
    id: string;
    nombre: string | null;
    descripcion: string | null;
    dataUrl: string;
  }>;
  tipo: 'MAYOR' | 'ANTICIPADO';
  mostrarValor: boolean;
  valor: number | null;
  fecha: Date;
};

export type PremioBoletasPayload = {
  numeros: string[];
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

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseImageDataUrl(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim().startsWith('data:image/')) {
    throw new AppError(`El campo "${fieldName}" debe ser una imagen en base64 valida.`);
  }

  return value.trim();
}

function parsePremioImagenes(value: unknown) {
  if (value === null || typeof value === 'undefined') {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError('El campo "imagenes" debe ser una lista valida.');
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(`La imagen ${index + 1} del premio no es valida.`);
    }

    const source = item as Record<string, unknown>;

    return {
      id:
        typeof source.id === 'string' && source.id.trim().length
          ? source.id.trim()
          : `imagen-${index + 1}`,
      nombre: parseOptionalString(source.nombre),
      descripcion: parseOptionalString(source.descripcion),
      dataUrl: parseImageDataUrl(source.dataUrl, `imagenes[${index}].dataUrl`),
    };
  });
}

function parseNumberField(value: unknown, fieldName: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new AppError(`El campo "${fieldName}" debe ser un numero valido.`);
  }

  return numberValue;
}

function parseDateField(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
  }

  return parsed;
}

function parseTipoPremio(value: unknown) {
  if (typeof value !== 'string') {
    throw new AppError('El campo "tipo" es obligatorio.');
  }

  const normalized = value.trim().toUpperCase();

  if (!['MAYOR', 'ANTICIPADO'].includes(normalized)) {
    throw new AppError('El tipo de premio no es valido.');
  }

  return normalized as 'MAYOR' | 'ANTICIPADO';
}

export function parsePremioPayload(input: PremioInput): PremioPayload {
  const mostrarValor = Boolean(input.mostrarValor);

  return {
    rifaId: parseRequiredString(input.rifaId, 'rifaId'),
    nombre: parseRequiredString(input.nombre, 'nombre'),
    descripcion: parseOptionalString(input.descripcion),
    imagenes: parsePremioImagenes(input.imagenes),
    tipo: parseTipoPremio(input.tipo),
    mostrarValor,
    valor: mostrarValor ? parseNumberField(input.valor, 'valor') : null,
    fecha: parseDateField(input.fecha, 'fecha'),
  };
}

export function parsePremioBoletasPayload(input: PremioBoletasInput): PremioBoletasPayload {
  if (!Array.isArray(input.numeros)) {
    throw new AppError('Debes enviar una lista de numeros para el premio.');
  }

  const numeros = input.numeros
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return {
    numeros: [...new Set(numeros)],
  };
}
