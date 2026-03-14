import { supabase } from './supabase';

export const statsAPI = {
  get: async () => {
    const [empRes, memRes, catRes, actRes, svcRes] = await Promise.all([
      supabase.from('empresas').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('activities')
        .select('*, member:team_members(name, color), empresa:empresas(company_name)')
        .order('created_at', { ascending: false })
        .limit(15),
      supabase.from('services').select('*').eq('active', true),
    ]);

    const empresas   = empRes.data ?? [];
    const members    = memRes.data ?? [];
    const categories = catRes.data ?? [];
    const rawActs    = actRes.data ?? [];
    const services   = svcRes.data ?? [];

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

    const serviceStats = services.map(s => {
      const mine = empresas.filter(e => e.service_id === s.id);
      return {
        name: s.name, color: s.color,
        total: mine.length,
        ganados: mine.filter(e => e.status === 'ganado').length,
        negociando: mine.filter(e => e.status === 'negociando').length,
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

    return { totals, memberStats, categoryStats, serviceStats, recentActivity, trend, conversionRate };
  },
};
