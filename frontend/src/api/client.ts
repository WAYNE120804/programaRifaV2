import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
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

    return Promise.reject(apiError);
  }
);

export default client;
