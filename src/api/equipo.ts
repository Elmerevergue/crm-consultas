import { supabase } from './supabase';

export const equipoAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('team_members').select('*').order('name');
    if (error) throw error;
    return data;
  },

  create: async (member: Record<string, string>) => {
    const { data, error } = await supabase
      .from('team_members').insert(member).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, fields: Record<string, string>) => {
    const { data, error } = await supabase
      .from('team_members').update(fields).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('team_members').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
