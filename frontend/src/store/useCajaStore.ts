import { create } from 'zustand';
import client from '../api/client';
import { endpoints } from '../api/endpoints';

export const useCajaStore = create((set) => ({
  cajas: [],
  loading: false,
  error: null,
  fetchCajas: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await client.get(endpoints.cajas());
      set({ cajas: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
