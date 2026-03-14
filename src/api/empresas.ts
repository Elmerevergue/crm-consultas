import { supabase } from './supabase';

/** Aplanar los JOINs de Supabase al formato plano que usan las páginas */
function flattenEmpresa(e: Record<string, unknown>): Record<string, unknown> {
  const cat = e.category as Record<string, string> | null;
  const asgn = e.assigned as Record<string, string> | null;
  const crtr = e.creator as Record<string, string> | null;
  const svc = e.service as Record<string, string> | null;
  const { category, assigned, creator, service, ...rest } = e;
  return {
    ...rest,
    category_name:   cat?.name  ?? null,
    category_color:  cat?.color ?? null,
    assigned_name:   asgn?.name  ?? null,
    assigned_color:  asgn?.color ?? null,
    created_by_name: crtr?.name ?? null,
    service_name:    svc?.name  ?? null,
    service_color:   svc?.color ?? null,
  };
}

const EMPRESA_SELECT = `
  *,
  category:categories(name, color),
  assigned:team_members!assigned_to(name, color),
  creator:team_members!created_by(name),
  service:services(name, color)
`;

export const empresasAPI = {
  getAll: async (params?: Record<string, string>) => {
    let query = supabase
      .from('empresas')
      .select(EMPRESA_SELECT)
      .order('created_at', { ascending: false });

    if (params?.status)      query = query.eq('status', params.status);
    if (params?.category_id) query = query.eq('category_id', params.category_id);
    if (params?.assigned_to) query = query.eq('assigned_to', params.assigned_to);
    if (params?.priority)    query = query.eq('priority', params.priority);
    if (params?.service_id)  query = query.eq('service_id', params.service_id);
    if (params?.search) {
      query = query.or(
        `company_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,location.ilike.%${params.search}%`
      );
    }
    if (params?.date_from) {
      query = query.gte('created_at', params.date_from);
    }
    if (params?.date_to) {
      query = query.lte('created_at', params.date_to + 'T23:59:59');
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(flattenEmpresa);
  },

  getById: async (id: string) => {
    const { data: emp, error: empErr } = await supabase
      .from('empresas')
      .select(EMPRESA_SELECT)
      .eq('id', id)
      .single();
    if (empErr) throw empErr;

    const { data: acts, error: actErr } = await supabase
      .from('activities')
      .select('*, member:team_members(name, color)')
      .eq('empresa_id', id)
      .order('created_at', { ascending: false });
    if (actErr) throw actErr;

    const activities = (acts ?? []).map((a: Record<string, unknown>) => {
      const m = a.member as Record<string, string> | null;
      const { member, ...rest } = a;
      return { ...rest, member_name: m?.name ?? null, member_color: m?.color ?? null };
    });

    return { ...flattenEmpresa(emp as Record<string, unknown>), activities };
  },

  create: async (payload: Record<string, unknown>) => {
    const { updated_by, ...fields } = payload;
    const { data, error } = await supabase
      .from('empresas').insert(fields).select().single();
    if (error) throw error;

    if (fields.created_by) {
      await supabase.from('activities').insert({
        empresa_id: data.id,
        team_member_id: fields.created_by,
        action: 'creado',
        notes: 'Empresa registrada',
      });
    }
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { updated_by, ...fields } = payload;

    const { data: prev } = await supabase
      .from('empresas').select('status').eq('id', id).single();

    const { data, error } = await supabase
      .from('empresas')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;

    if (prev && prev.status !== fields.status && updated_by) {
      await supabase.from('activities').insert({
        empresa_id: id,
        team_member_id: updated_by as string,
        action: 'estado_cambiado',
        notes: `Estado cambiado: ${prev.status} → ${fields.status}`,
      });
    }
    return data;
  },

  updateStatus: async (id: string, status: string, userId?: string) => {
    const { data: prev } = await supabase
      .from('empresas').select('status').eq('id', id).single();

    const { data, error } = await supabase
      .from('empresas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;

    if (prev && prev.status !== status && userId) {
      await supabase.from('activities').insert({
        empresa_id: id,
        team_member_id: userId,
        action: 'estado_cambiado',
        notes: `Estado cambiado: ${prev.status} → ${status}`,
      });
    }
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
