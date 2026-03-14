import { supabase } from './supabase';

export const actividadesAPI = {
  create: async (payload: Record<string, string>) => {
    const { data, error } = await supabase
      .from('activities').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
};
