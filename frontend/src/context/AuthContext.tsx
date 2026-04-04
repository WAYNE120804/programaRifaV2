import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import client from '../api/client';
import { endpoints } from '../api/endpoints';

const AUTH_TOKEN_KEY = 'rifas_admin_token';

type AuthUser = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function storeToken(token: string | null) {
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    storeToken(null);
  };

  const refreshSession = async () => {
    const activeToken = getStoredToken();

    if (!activeToken) {
      setUser(null);
      return;
    }

    const { data } = await client.get(endpoints.authMe());
    setToken(activeToken);
    setUser(data);
  };

  const login = async (email: string, password: string) => {
    const { data } = await client.post(endpoints.authLogin(), { email, password });
    storeToken(data.token);
    setToken(data.token);
    setUser(data.usuario);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (token) {
          await refreshSession();
        }
      } catch (_error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleUnauthorized);
    return () => window.removeEventListener('auth:logout', handleUnauthorized);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      refreshSession,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
};

export { AUTH_TOKEN_KEY };
