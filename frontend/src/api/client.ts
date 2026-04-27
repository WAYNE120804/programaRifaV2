import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const AUTH_TOKEN_KEY = 'almacen_admin_token';

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error.message;
    const apiError = new Error(message) as Error & {
      status?: number;
      code?: string;
      details?: unknown;
    };

    apiError.status = error?.response?.status;
    apiError.code = error?.response?.data?.code;
    apiError.details = error?.response?.data?.details;

    if (apiError.status === 401) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }

    return Promise.reject(apiError);
  }
);

export default client;
