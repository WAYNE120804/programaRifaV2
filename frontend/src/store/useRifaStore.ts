import { create } from 'zustand';
import client from '../api/client';
import { endpoints } from '../api/endpoints';

export const useRifaStore = create((set) => ({
  rifas: [],
  loading: false,
  error: null,
  fetchRifas: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await client.get(endpoints.rifas());
      set({ rifas: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
