import { AppError } from '../../lib/app-error';

type ConfiguracionInput = {
  nombreNegocio?: unknown;
  logoDataUrl?: unknown;
  propietarioNombre?: unknown;
  propietarioTelefono?: unknown;
  direccion?: unknown;
  ciudad?: unknown;
  departamento?: unknown;
  notasRecibo?: unknown;
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
  nombreNegocio: string;
  logoDataUrl: string | null;
  propietarioNombre: string | null;
  propietarioTelefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  notasRecibo: string | null;
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
    throw new AppError('El campo "nombreNegocio" es obligatorio.');
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
    nombreNegocio: parseRequiredName(input.nombreNegocio),
    logoDataUrl: parseLogoDataUrl(input.logoDataUrl),
    propietarioNombre: parseOptionalText(input.propietarioNombre, 'propietarioNombre'),
    propietarioTelefono: parseOptionalText(input.propietarioTelefono, 'propietarioTelefono'),
    direccion: parseOptionalText(input.direccion, 'direccion'),
    ciudad: parseOptionalText(input.ciudad, 'ciudad'),
    departamento: parseOptionalText(input.departamento, 'departamento'),
    notasRecibo: parseOptionalText(input.notasRecibo, 'notasRecibo'),
    themeColors: parseThemeColors(input.themeColors),
  };
}
