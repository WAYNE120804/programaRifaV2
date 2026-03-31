import { AppError } from '../../lib/app-error';

type ConfiguracionInput = {
  nombreCasaRifera?: unknown;
  logoDataUrl?: unknown;
  reglamentoDataUrl?: unknown;
  reglamentoNombreArchivo?: unknown;
  responsableNombre?: unknown;
  responsableTelefono?: unknown;
  responsableDireccion?: unknown;
  responsableCiudad?: unknown;
  responsableDepartamento?: unknown;
  numeroResolucionAutorizacion?: unknown;
  entidadAutoriza?: unknown;
  themeColors?: unknown;
};

type ThemeColorsPayload = {
  sidebarBg: string;
  sidebarButtonBg: string;
  sidebarButtonText: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
  topbarBg: string;
  topbarText: string;
  sectionTitleText: string;
  sectionSubtitleText: string;
  summaryLabelText: string;
  summaryValueText: string;
  tableHeaderBg: string;
  tableHeaderText: string;
};

export type ConfiguracionPayload = {
  nombreCasaRifera: string;
  logoDataUrl: string | null;
  reglamentoDataUrl: string | null;
  reglamentoNombreArchivo: string | null;
  responsableNombre: string | null;
  responsableTelefono: string | null;
  responsableDireccion: string | null;
  responsableCiudad: string | null;
  responsableDepartamento: string | null;
  numeroResolucionAutorizacion: string | null;
  entidadAutoriza: string | null;
  themeColors: ThemeColorsPayload;
};

const defaultThemeColors: ThemeColorsPayload = {
  sidebarBg: '#ffffff',
  sidebarButtonBg: '#ffffff',
  sidebarButtonText: '#334155',
  sidebarActiveBg: '#e2e8f0',
  sidebarActiveText: '#0f172a',
  topbarBg: '#ffffff',
  topbarText: '#0f172a',
  sectionTitleText: '#0f172a',
  sectionSubtitleText: '#64748b',
  summaryLabelText: '#94a3b8',
  summaryValueText: '#0f172a',
  tableHeaderBg: '#f1f5f9',
  tableHeaderText: '#475569',
};

function parseRequiredName(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError('El campo "nombreCasaRifera" es obligatorio.');
  }

  return value.trim();
}

function parseLogoDataUrl(value: unknown) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError('El campo "logoDataUrl" debe ser una cadena valida o null.');
  }

  const normalizedValue = value.trim();

  if (!normalizedValue.startsWith('data:image/')) {
    throw new AppError('El logo debe enviarse como imagen en formato base64.');
  }

  return normalizedValue;
}

function parseOptionalDataUrl(value: unknown, fieldName: string) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(`El campo "${fieldName}" debe ser una cadena valida o null.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue.startsWith('data:')) {
    throw new AppError(`El campo "${fieldName}" debe enviarse como archivo en formato base64.`);
  }

  return normalizedValue;
}

function parseOptionalText(value: unknown, fieldName: string) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(`El campo "${fieldName}" debe ser una cadena valida o null.`);
  }

  const normalizedValue = value.trim();
  return normalizedValue.length ? normalizedValue : null;
}

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{6})$/.test(value);
}

function parseThemeColors(value: unknown): ThemeColorsPayload {
  if (value === null || typeof value === 'undefined') {
    return defaultThemeColors;
  }

  if (typeof value !== 'object') {
    throw new AppError('El campo "themeColors" debe ser un objeto valido.');
  }

  const source = value as Record<string, unknown>;
  const result = { ...defaultThemeColors };

  for (const key of Object.keys(defaultThemeColors) as Array<keyof ThemeColorsPayload>) {
    const raw = source[key];

    if (typeof raw === 'undefined' || raw === null || raw === '') {
      continue;
    }

    if (typeof raw !== 'string' || !isHexColor(raw.trim())) {
      throw new AppError(`El color "${key}" debe estar en formato hexadecimal #RRGGBB.`);
    }

    result[key] = raw.trim();
  }

  return result;
}

export function parseConfiguracionPayload(
  input: ConfiguracionInput
): ConfiguracionPayload {
  return {
    nombreCasaRifera: parseRequiredName(input.nombreCasaRifera),
    logoDataUrl: parseLogoDataUrl(input.logoDataUrl),
    reglamentoDataUrl: parseOptionalDataUrl(input.reglamentoDataUrl, 'reglamentoDataUrl'),
    reglamentoNombreArchivo: parseOptionalText(
      input.reglamentoNombreArchivo,
      'reglamentoNombreArchivo'
    ),
    responsableNombre: parseOptionalText(input.responsableNombre, 'responsableNombre'),
    responsableTelefono: parseOptionalText(input.responsableTelefono, 'responsableTelefono'),
    responsableDireccion: parseOptionalText(input.responsableDireccion, 'responsableDireccion'),
    responsableCiudad: parseOptionalText(input.responsableCiudad, 'responsableCiudad'),
    responsableDepartamento: parseOptionalText(
      input.responsableDepartamento,
      'responsableDepartamento'
    ),
    numeroResolucionAutorizacion: parseOptionalText(
      input.numeroResolucionAutorizacion,
      'numeroResolucionAutorizacion'
    ),
    entidadAutoriza: parseOptionalText(input.entidadAutoriza, 'entidadAutoriza'),
    themeColors: parseThemeColors(input.themeColors),
  };
}
