import { supabase } from './supabase';

export const templatesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('category')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  create: async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('message_templates').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, fields: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('message_templates').update(fields).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('message_templates').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  /** Reemplaza variables {{nombre_cliente}}, {{empresa}}, {{servicio}} en el contenido */
  fillTemplate: (content: string, vars: Record<string, string>): string => {
    let result = content;
    Object.entries(vars).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    });
    return result;
  },
};
