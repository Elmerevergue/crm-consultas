import { supabase } from './supabase';

export const categoriasAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories').select('*').order('name');
    if (error) throw error;
    return data;
  },

  create: async (cat: Record<string, string>) => {
    const { data, error } = await supabase
      .from('categories').insert(cat).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, fields: Record<string, string>) => {
    const { data, error } = await supabase
      .from('categories').update(fields).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
