import { supabase } from '../lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Aplanar los JOINs de Supabase al formato plano que usan las páginas */
function flattenEmpresa(e: Record<string, unknown>): Record<string, unknown> {
  const cat = e.category as Record<string, string> | null;
  const asgn = e.assigned as Record<string, string> | null;
  const crtr = e.creator as Record<string, string> | null;
  const { category, assigned, creator, ...rest } = e;
  return {
    ...rest,
    category_name:   cat?.name  ?? null,
    category_color:  cat?.color ?? null,
    assigned_name:   asgn?.name  ?? null,
    assigned_color:  asgn?.color ?? null,
    created_by_name: crtr?.name ?? null,
  };
}

const EMPRESA_SELECT = `
  *,
  category:categories(name, color),
  assigned:team_members!assigned_to(name, color),
  creator:team_members!created_by(name)
`;

// ─── Equipo ───────────────────────────────────────────────────────────────────

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

// ─── Categorías ───────────────────────────────────────────────────────────────

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

// ─── Empresas ─────────────────────────────────────────────────────────────────

export const empresasAPI = {
  getAll: async (params?: Record<string, string>) => {
    let query = supabase
      .from('empresas')
      .select(EMPRESA_SELECT)
      .order('created_at', { ascending: false });

    if (params?.status)      query = query.eq('status', params.status);
    if (params?.category_id) query = query.eq('category_id', params.category_id);
    if (params?.assigned_to) query = query.eq('assigned_to', params.assigned_to);
    if (params?.search) {
      query = query.or(
        `company_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,location.ilike.%${params.search}%`
      );
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

  delete: async (id: string) => {
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};

// ─── Actividades ──────────────────────────────────────────────────────────────

export const actividadesAPI = {
  create: async (payload: Record<string, string>) => {
    const { data, error } = await supabase
      .from('activities').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
};

// ─── Estadísticas (calculadas en el cliente) ─────────────────────────────────

export const statsAPI = {
  get: async () => {
    const [empRes, memRes, catRes, actRes] = await Promise.all([
      supabase.from('empresas').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('activities')
        .select('*, member:team_members(name, color), empresa:empresas(company_name)')
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

    const empresas   = empRes.data ?? [];
    const members    = memRes.data ?? [];
    const categories = catRes.data ?? [];
    const rawActs    = actRes.data ?? [];

    const cnt = (fn: (e: Record<string, unknown>) => boolean) => empresas.filter(fn).length;

    const totals = {
      totalEmpresas: empresas.length,
      ganadas:       cnt(e => e.status === 'ganado'),
      enNegociacion: cnt(e => e.status === 'negociando'),
      perdidas:      cnt(e => e.status === 'perdido'),
      prospectos:    cnt(e => e.status === 'prospecto'),
      contactados:   cnt(e => e.status === 'contactado'),
    };

    const memberStats = members.map(m => {
      const mine = empresas.filter(e => e.assigned_to === m.id);
      return {
        id: m.id, name: m.name, color: m.color,
        total:       mine.length,
        ganados:     mine.filter(e => e.status === 'ganado').length,
        negociando:  mine.filter(e => e.status === 'negociando').length,
        perdidos:    mine.filter(e => e.status === 'perdido').length,
        prospectos:  mine.filter(e => e.status === 'prospecto').length,
        contactados: mine.filter(e => e.status === 'contactado').length,
      };
    }).sort((a, b) => b.ganados - a.ganados || b.total - a.total);

    const categoryStats = categories.map(c => {
      const mine = empresas.filter(e => e.category_id === c.id);
      return {
        name: c.name, color: c.color,
        total: mine.length,
        ganados: mine.filter(e => e.status === 'ganado').length,
      };
    }).sort((a, b) => b.total - a.total);

    const sixAgo = new Date();
    sixAgo.setMonth(sixAgo.getMonth() - 6);
    const trendMap: Record<string, { month: string; total: number; ganadas: number }> = {};
    empresas
      .filter(e => new Date(e.created_at as string) >= sixAgo)
      .forEach(e => {
        const mo = (e.created_at as string).slice(0, 7);
        if (!trendMap[mo]) trendMap[mo] = { month: mo, total: 0, ganadas: 0 };
        trendMap[mo].total++;
        if (e.status === 'ganado') trendMap[mo].ganadas++;
      });
    const trend = Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));

    const recentActivity = rawActs.map((a: Record<string, unknown>) => {
      const m = a.member as Record<string, string> | null;
      const emp = a.empresa as Record<string, string> | null;
      const { member, empresa, ...rest } = a;
      return {
        ...rest,
        member_name:  m?.name  ?? null,
        member_color: m?.color ?? null,
        company_name: emp?.company_name ?? null,
      };
    });

    const conversionRate = totals.totalEmpresas > 0
      ? ((totals.ganadas / totals.totalEmpresas) * 100).toFixed(1)
      : '0.0';

    return { totals, memberStats, categoryStats, recentActivity, trend, conversionRate };
  },
};
