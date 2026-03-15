import { supabase } from './supabase';

export const pagosAPI = {
  getByEmpresa: async (empresaId: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, creator:team_members(name)')
      .eq('empresa_id', empresaId)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p: Record<string, unknown>) => {
      const cr = p.creator as Record<string, string> | null;
      const { creator, ...rest } = p;
      return { ...rest, creator_name: cr?.name ?? null };
    });
  },

  getAll: async (filters?: { type?: string; status?: string; empresa_id?: string }) => {
    let query = supabase
      .from('payments')
      .select('*, empresa:empresas(company_name), creator:team_members(name)')
      .order('date', { ascending: false });

    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.empresa_id) query = query.eq('empresa_id', filters.empresa_id);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((p: Record<string, unknown>) => {
      const emp = p.empresa as Record<string, string> | null;
      const cr = p.creator as Record<string, string> | null;
      const { empresa, creator, ...rest } = p;
      return { ...rest, empresa_name: emp?.company_name ?? null, creator_name: cr?.name ?? null };
    });
  },

  create: async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('payments').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, fields: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('payments').update(fields).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
