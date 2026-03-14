import { supabase } from './supabase';

export const remindersAPI = {
  getAll: async (filters?: { completed?: boolean; member_id?: string }) => {
    let query = supabase
      .from('reminders')
      .select('*, empresa:empresas(company_name), member:team_members(name, color)')
      .order('due_date', { ascending: true });

    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }
    if (filters?.member_id) {
      query = query.eq('team_member_id', filters.member_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => {
      const emp = r.empresa as Record<string, string> | null;
      const mem = r.member as Record<string, string> | null;
      const { empresa, member, ...rest } = r;
      return {
        ...rest,
        empresa_name: emp?.company_name ?? null,
        member_name: mem?.name ?? null,
        member_color: mem?.color ?? null,
      };
    });
  },

  getByEmpresa: async (empresaId: string) => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, member:team_members(name, color)')
      .eq('empresa_id', empresaId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => {
      const mem = r.member as Record<string, string> | null;
      const { member, ...rest } = r;
      return { ...rest, member_name: mem?.name ?? null, member_color: mem?.color ?? null };
    });
  },

  create: async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('reminders').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, fields: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('reminders').update(fields).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  toggleComplete: async (id: string, completed: boolean) => {
    const { data, error } = await supabase
      .from('reminders').update({ completed }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
