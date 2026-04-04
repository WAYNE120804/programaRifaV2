import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import client from '../api/client';
import { endpoints } from '../api/endpoints';

type AppConfig = {
  id?: string;
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
  publicPrizeGallery: Array<{
    id: string;
    nombre: string | null;
    descripcion: string | null;
    dataUrl: string;
  }>;
  themeColors: {
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
};

type AppConfigContextValue = {
  config: AppConfig;
  loading: boolean;
  refreshConfig: () => Promise<void>;
  saveConfig: (payload: AppConfig) => Promise<AppConfig>;
};

const defaultConfig: AppConfig = {
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

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

export const AppConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const refreshConfig = async () => {
    const { data } = await client.get(endpoints.configuracion());
    setConfig({
      id: data.id,
      nombreCasaRifera: data.nombreCasaRifera || 'Rifas Admin',
      logoDataUrl: data.logoDataUrl || null,
      reglamentoDataUrl: data.reglamentoDataUrl || null,
      reglamentoNombreArchivo: data.reglamentoNombreArchivo || null,
      responsableNombre: data.responsableNombre || null,
      responsableTelefono: data.responsableTelefono || null,
      responsableDireccion: data.responsableDireccion || null,
      responsableCiudad: data.responsableCiudad || null,
      responsableDepartamento: data.responsableDepartamento || null,
      numeroResolucionAutorizacion: data.numeroResolucionAutorizacion || null,
      entidadAutoriza: data.entidadAutoriza || null,
      publicHeroTitle: data.publicHeroTitle || defaultConfig.publicHeroTitle,
      publicHeroSubtitle: data.publicHeroSubtitle || null,
      publicWhoWeAre: data.publicWhoWeAre || null,
      publicContactPhone: data.publicContactPhone || null,
      publicContactWhatsapp: data.publicContactWhatsapp || null,
      publicContactEmail: data.publicContactEmail || null,
      publicAddress: data.publicAddress || null,
      publicCity: data.publicCity || null,
      publicDepartment: data.publicDepartment || null,
      publicFacebookUrl: data.publicFacebookUrl || null,
      publicInstagramUrl: data.publicInstagramUrl || null,
      publicTiktokUrl: data.publicTiktokUrl || null,
      publicPrimaryCtaText: data.publicPrimaryCtaText || defaultConfig.publicPrimaryCtaText,
      publicSecondaryCtaText:
        data.publicSecondaryCtaText || defaultConfig.publicSecondaryCtaText,
      publicSupportText: data.publicSupportText || null,
      publicTermsText: data.publicTermsText || null,
      publicHeroImageDataUrl: data.publicHeroImageDataUrl || null,
      publicTicketBackgroundDataUrl: data.publicTicketBackgroundDataUrl || null,
      publicPrizeGallery: Array.isArray(data.publicPrizeGallery)
        ? data.publicPrizeGallery
        : [],
      themeColors: {
        ...defaultConfig.themeColors,
        ...(data.themeColors || {}),
      },
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        await refreshConfig();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const saveConfig = async (payload: AppConfig) => {
    const { data } = await client.put(endpoints.configuracion(), payload);
    const nextConfig = {
      id: data.id,
      nombreCasaRifera: data.nombreCasaRifera || 'Rifas Admin',
      logoDataUrl: data.logoDataUrl || null,
      reglamentoDataUrl: data.reglamentoDataUrl || null,
      reglamentoNombreArchivo: data.reglamentoNombreArchivo || null,
      responsableNombre: data.responsableNombre || null,
      responsableTelefono: data.responsableTelefono || null,
      responsableDireccion: data.responsableDireccion || null,
      responsableCiudad: data.responsableCiudad || null,
      responsableDepartamento: data.responsableDepartamento || null,
      numeroResolucionAutorizacion: data.numeroResolucionAutorizacion || null,
      entidadAutoriza: data.entidadAutoriza || null,
      publicHeroTitle: data.publicHeroTitle || defaultConfig.publicHeroTitle,
      publicHeroSubtitle: data.publicHeroSubtitle || null,
      publicWhoWeAre: data.publicWhoWeAre || null,
      publicContactPhone: data.publicContactPhone || null,
      publicContactWhatsapp: data.publicContactWhatsapp || null,
      publicContactEmail: data.publicContactEmail || null,
      publicAddress: data.publicAddress || null,
      publicCity: data.publicCity || null,
      publicDepartment: data.publicDepartment || null,
      publicFacebookUrl: data.publicFacebookUrl || null,
      publicInstagramUrl: data.publicInstagramUrl || null,
      publicTiktokUrl: data.publicTiktokUrl || null,
      publicPrimaryCtaText: data.publicPrimaryCtaText || defaultConfig.publicPrimaryCtaText,
      publicSecondaryCtaText:
        data.publicSecondaryCtaText || defaultConfig.publicSecondaryCtaText,
      publicSupportText: data.publicSupportText || null,
      publicTermsText: data.publicTermsText || null,
      publicHeroImageDataUrl: data.publicHeroImageDataUrl || null,
      publicTicketBackgroundDataUrl: data.publicTicketBackgroundDataUrl || null,
      publicPrizeGallery: Array.isArray(data.publicPrizeGallery)
        ? data.publicPrizeGallery
        : [],
      themeColors: {
        ...defaultConfig.themeColors,
        ...(data.themeColors || {}),
      },
    };

    setConfig(nextConfig);
    return nextConfig;
  };

  return (
    <AppConfigContext.Provider
      value={{
        config,
        loading,
        refreshConfig,
        saveConfig,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);

  if (!context) {
    throw new Error('useAppConfig debe usarse dentro de AppConfigProvider.');
  }

  return context;
};
