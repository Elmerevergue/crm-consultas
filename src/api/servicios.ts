import { supabase } from './supabase';

export const serviciosAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('services').select('*').order('name');
    if (error) throw error;
    return data;
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('services').select('*').eq('active', true).order('name');
    if (error) throw error;
    return data;
  },

  create: async (service: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('services').insert(service).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, fields: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('services').update(fields).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('services').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
