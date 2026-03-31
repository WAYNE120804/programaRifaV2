import { create } from 'zustand';
import client from '../api/client';
import { endpoints } from '../api/endpoints';

export const useVendedorStore = create((set) => ({
  vendedores: [],
  loading: false,
  error: null,
  fetchVendedores: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await client.get(endpoints.vendedores());
      set({ vendedores: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
