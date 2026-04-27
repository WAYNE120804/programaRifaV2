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
  nombreNegocio: string;
  logoDataUrl: string | null;
  propietarioNombre: string | null;
  propietarioTelefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  notasRecibo: string | null;
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
  nombreNegocio: 'Almacen Admin',
  logoDataUrl: null,
  propietarioNombre: null,
  propietarioTelefono: null,
  direccion: null,
  ciudad: null,
  departamento: null,
  notasRecibo: null,
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
      nombreNegocio: data.nombreNegocio || 'Almacen Admin',
      logoDataUrl: data.logoDataUrl || null,
      propietarioNombre: data.propietarioNombre || null,
      propietarioTelefono: data.propietarioTelefono || null,
      direccion: data.direccion || null,
      ciudad: data.ciudad || null,
      departamento: data.departamento || null,
      notasRecibo: data.notasRecibo || null,
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
      nombreNegocio: data.nombreNegocio || 'Almacen Admin',
      logoDataUrl: data.logoDataUrl || null,
      propietarioNombre: data.propietarioNombre || null,
      propietarioTelefono: data.propietarioTelefono || null,
      direccion: data.direccion || null,
      ciudad: data.ciudad || null,
      departamento: data.departamento || null,
      notasRecibo: data.notasRecibo || null,
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
