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
  publicHeroTitle?: unknown;
  publicHeroSubtitle?: unknown;
  publicWhoWeAre?: unknown;
  publicContactPhone?: unknown;
  publicContactWhatsapp?: unknown;
  publicContactEmail?: unknown;
  publicAddress?: unknown;
  publicCity?: unknown;
  publicDepartment?: unknown;
  publicFacebookUrl?: unknown;
  publicInstagramUrl?: unknown;
  publicTiktokUrl?: unknown;
  publicPrimaryCtaText?: unknown;
  publicSecondaryCtaText?: unknown;
  publicSupportText?: unknown;
  publicTermsText?: unknown;
  publicHeroImageDataUrl?: unknown;
  publicTicketBackgroundDataUrl?: unknown;
  publicPrizeGallery?: unknown;
  themeColors?: unknown;
};

type PrizeGalleryItemPayload = {
  id: string;
  nombre: string | null;
  descripcion: string | null;
  dataUrl: string;
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
  publicHeroTitle: string | null;
  publicHeroSubtitle: string | null;
  publicWhoWeAre: string | null;
  publicContactPhone: string | null;
  publicContactWhatsapp: string | null;
  publicContactEmail: string | null;
  publicAddress: string | null;
  publicCity: string | null;
  publicDepartment: string | null;
  publicFacebookUrl: string | null;
  publicInstagramUrl: string | null;
  publicTiktokUrl: string | null;
  publicPrimaryCtaText: string | null;
  publicSecondaryCtaText: string | null;
  publicSupportText: string | null;
  publicTermsText: string | null;
  publicHeroImageDataUrl: string | null;
  publicTicketBackgroundDataUrl: string | null;
  publicPrizeGallery: PrizeGalleryItemPayload[];
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

function parseOptionalImageDataUrl(value: unknown, fieldName: string) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(`El campo "${fieldName}" debe ser una cadena valida o null.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue.startsWith('data:image/')) {
    throw new AppError(`El campo "${fieldName}" debe enviarse como imagen en formato base64.`);
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

function parsePrizeGallery(value: unknown): PrizeGalleryItemPayload[] {
  if (value === null || typeof value === 'undefined') {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError('El campo "publicPrizeGallery" debe ser una lista valida.');
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(`La imagen ${index + 1} de la galeria no es valida.`);
    }

    const source = item as Record<string, unknown>;
    const id =
      typeof source.id === 'string' && source.id.trim().length
        ? source.id.trim()
        : `gallery-${index + 1}`;
    const nombre =
      typeof source.nombre === 'string' && source.nombre.trim().length
        ? source.nombre.trim()
        : null;
    const descripcion =
      typeof source.descripcion === 'string' && source.descripcion.trim().length
        ? source.descripcion.trim()
        : null;
    const dataUrl = parseOptionalImageDataUrl(
      source.dataUrl,
      `publicPrizeGallery[${index}].dataUrl`
    );

    if (!dataUrl) {
      throw new AppError(`La imagen ${index + 1} de la galeria debe tener archivo.`);
    }

    return {
      id,
      nombre,
      descripcion,
      dataUrl,
    };
  });
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
    publicHeroTitle: parseOptionalText(input.publicHeroTitle, 'publicHeroTitle'),
    publicHeroSubtitle: parseOptionalText(input.publicHeroSubtitle, 'publicHeroSubtitle'),
    publicWhoWeAre: parseOptionalText(input.publicWhoWeAre, 'publicWhoWeAre'),
    publicContactPhone: parseOptionalText(input.publicContactPhone, 'publicContactPhone'),
    publicContactWhatsapp: parseOptionalText(
      input.publicContactWhatsapp,
      'publicContactWhatsapp'
    ),
    publicContactEmail: parseOptionalText(input.publicContactEmail, 'publicContactEmail'),
    publicAddress: parseOptionalText(input.publicAddress, 'publicAddress'),
    publicCity: parseOptionalText(input.publicCity, 'publicCity'),
    publicDepartment: parseOptionalText(input.publicDepartment, 'publicDepartment'),
    publicFacebookUrl: parseOptionalText(input.publicFacebookUrl, 'publicFacebookUrl'),
    publicInstagramUrl: parseOptionalText(input.publicInstagramUrl, 'publicInstagramUrl'),
    publicTiktokUrl: parseOptionalText(input.publicTiktokUrl, 'publicTiktokUrl'),
    publicPrimaryCtaText: parseOptionalText(
      input.publicPrimaryCtaText,
      'publicPrimaryCtaText'
    ),
    publicSecondaryCtaText: parseOptionalText(
      input.publicSecondaryCtaText,
      'publicSecondaryCtaText'
    ),
    publicSupportText: parseOptionalText(input.publicSupportText, 'publicSupportText'),
    publicTermsText: parseOptionalText(input.publicTermsText, 'publicTermsText'),
    publicHeroImageDataUrl: parseOptionalImageDataUrl(
      input.publicHeroImageDataUrl,
      'publicHeroImageDataUrl'
    ),
    publicTicketBackgroundDataUrl: parseOptionalImageDataUrl(
      input.publicTicketBackgroundDataUrl,
      'publicTicketBackgroundDataUrl'
    ),
    publicPrizeGallery: parsePrizeGallery(input.publicPrizeGallery),
    themeColors: parseThemeColors(input.themeColors),
  };
}
