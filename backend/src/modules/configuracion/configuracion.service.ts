import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ConfiguracionPayload } from './configuracion.schemas';

const configDir = path.resolve(process.cwd(), 'storage');
const configFile = path.join(configDir, 'configuracion.json');
const defaultConfig: ConfiguracionPayload & { id: string; clave: string } = {
  id: 'principal',
  clave: 'principal',
  nombreCasaRifera: 'Rifas Admin',
  logoDataUrl: null,
  reglamentoDataUrl: null,
  reglamentoNombreArchivo: null,
  responsableNombre: null,
  responsableTelefono: null,
  responsableDireccion: null,
  responsableCiudad: null,
  responsableDepartamento: null,
  numeroResolucionAutorizacion: null,
  entidadAutoriza: null,
  publicHeroTitle: 'Juega y gana con nosotros',
  publicHeroSubtitle: null,
  publicWhoWeAre: null,
  publicContactPhone: null,
  publicContactWhatsapp: null,
  publicContactEmail: null,
  publicAddress: null,
  publicCity: null,
  publicDepartment: null,
  publicFacebookUrl: null,
  publicInstagramUrl: null,
  publicTiktokUrl: null,
  publicPrimaryCtaText: 'Comprar boletas',
  publicSecondaryCtaText: 'Verificar compra',
  publicSupportText: null,
  publicTermsText: null,
  publicHeroImageDataUrl: null,
  publicTicketBackgroundDataUrl: null,
  publicPrizeGallery: [],
  themeColors: {
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
  },
};

async function ensureConfigFile() {
  await mkdir(configDir, { recursive: true });

  try {
    const raw = await readFile(configFile, 'utf-8');
    const parsed = JSON.parse(raw);

    return {
      ...defaultConfig,
      ...parsed,
    };
  } catch (_error) {
    await writeFile(configFile, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

export async function getConfiguracionSistema() {
  return ensureConfigFile();
}

export async function updateConfiguracionSistema(payload: ConfiguracionPayload) {
  const nextConfig = {
    ...(await ensureConfigFile()),
    ...payload,
  };

  await writeFile(configFile, JSON.stringify(nextConfig, null, 2), 'utf-8');
  return nextConfig;
}
