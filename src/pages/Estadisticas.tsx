import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../api/client';
import { Stats, MemberStat } from '../types';
import Avatar from '../components/Avatar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Trophy, TrendingUp, BarChart3, Users } from 'lucide-react';

function MedallaBadge({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-xl">🥇</span>;
  if (pos === 1) return <span className="text-xl">🥈</span>;
  if (pos === 2) return <span className="text-xl">🥉</span>;
  return <span className="text-sm font-bold text-gray-400 w-6 text-center">{pos + 1}</span>;
}

const STATUS_FILL: Record<string, string> = {
  ganados:    '#10B981',
  negociando: '#F59E0B',
  perdidos:   '#EF4444',
  prospectos: '#9CA3AF',
  contactados:'#3B82F6',
};

export default function Estadisticas() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: statsAPI.get,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { totals, memberStats, categoryStats, trend, conversionRate } = stats;

  // Data for stacked bar (team)
  const teamBarData = memberStats.map(m => ({
    name:        m.name,
    Ganados:     m.ganados,
    Negociando:  m.negociando,
    Contactados: m.contactados,
    Prospectos:  m.prospectos,
    Perdidos:    m.perdidos,
  }));

  // Data for radar (category distribution)
  const radarData = categoryStats.slice(0, 6).map(c => ({
    subject: c.name,
    total:   c.total,
    ganados: c.ganados,
  }));

  const trendFormatted = trend.map(t => ({
    ...t,
    Mes: t.month,
    Registradas: t.total,
    Ganadas: t.ganadas,
  }));

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Estadísticas</h1>
        <p className="text-gray-500 text-sm mt-1">Análisis detallado del rendimiento del equipo</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total empresas',   value: totals.totalEmpresas,   color: 'bg-blue-50  text-blue-600',   icon: BarChart3 },
          { label: 'Ganadas',          value: totals.ganadas,         color: 'bg-green-50 text-green-600',  icon: Trophy },
          { label: 'En negociación',   value: totals.enNegociacion,   color: 'bg-amber-50 text-amber-600',  icon: TrendingUp },
          { label: 'Tasa conversión',  value: `${conversionRate}%`,   color: 'bg-indigo-50 text-indigo-600',icon: Users },
        ].map(k => (
          <div key={k.label} className="card p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${k.color} flex items-center justify-center mx-auto mb-3`}>
              <k.icon size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Ranking */}
      <div className="card p-5">
        <h2 className="section-title mb-5 flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" /> Ranking del equipo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-3 text-xs text-gray-400 uppercase tracking-wide font-medium">#</th>
                <th className="text-left pb-3 text-xs text-gray-400 uppercase tracking-wide font-medium">Asesor</th>
                <th className="text-right pb-3 text-xs text-gray-400 uppercase tracking-wide font-medium">Total</th>
                <th className="text-right pb-3 text-xs text-green-600 uppercase tracking-wide font-medium">Ganados</th>
                <th className="text-right pb-3 text-xs text-amber-600 uppercase tracking-wide font-medium">Neg.</th>
                <th className="text-right pb-3 text-xs text-blue-600 uppercase tracking-wide font-medium">Contact.</th>
                <th className="text-right pb-3 text-xs text-red-500 uppercase tracking-wide font-medium">Perdidos</th>
                <th className="text-right pb-3 text-xs text-gray-400 uppercase tracking-wide font-medium">Conv%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {memberStats.map((m, i) => (
                <tr key={m.id} className={`${i === 0 ? 'bg-amber-50/50' : ''}`}>
                  <td className="py-3 pr-3">
                    <MedallaBadge pos={i} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={m.name} color={m.color} size="sm" />
                      <span className="font-medium text-gray-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium text-gray-700">{m.total}</td>
                  <td className="py-3 text-right font-bold text-green-600">{m.ganados}</td>
                  <td className="py-3 text-right text-amber-600">{m.negociando}</td>
                  <td className="py-3 text-right text-blue-600">{m.contactados}</td>
                  <td className="py-3 text-right text-red-500">{m.perdidos}</td>
                  <td className="py-3 text-right text-gray-500">
                    {m.total > 0 ? ((m.ganados / m.total) * 100).toFixed(0) : 0}%
                  </td>
                </tr>
              ))}
              {memberStats.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">Sin datos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stacked bar */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Empresas por asesor</h2>
          {teamBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={teamBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="Ganados"     stackId="a" fill="#10B981" radius={[0,0,0,0]} />
                <Bar dataKey="Negociando"  stackId="a" fill="#F59E0B" />
                <Bar dataKey="Contactados" stackId="a" fill="#3B82F6" />
                <Bar dataKey="Prospectos"  stackId="a" fill="#D1D5DB" />
                <Bar dataKey="Perdidos"    stackId="a" fill="#EF4444" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          )}
        </div>

        {/* Trend */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Tendencia mensual</h2>
          {trendFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="Registradas" fill="#93C5FD" radius={[3,3,0,0]} />
                <Bar dataKey="Ganadas"     fill="#10B981" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              Sin datos suficientes
            </div>
          )}
        </div>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category table */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Por categoría</h2>
          <div className="space-y-3">
            {categoryStats.map(cat => {
              const pct = cat.total > 0 ? (cat.ganados / cat.total) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {cat.ganados}/{cat.total} ({pct.toFixed(0)}%)
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
            {categoryStats.length === 0 && (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Distribución total</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Prospectos',   value: totals.prospectos    || 0, fill: '#9CA3AF' },
                  { name: 'Contactados',  value: totals.contactados   || 0, fill: '#3B82F6' },
                  { name: 'Negociando',   value: totals.enNegociacion || 0, fill: '#F59E0B' },
                  { name: 'Ganadas',      value: totals.ganadas       || 0, fill: '#10B981' },
                  { name: 'Perdidas',     value: totals.perdidas      || 0, fill: '#EF4444' },
                ].filter(d => d.value > 0)}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                dataKey="value"
                nameKey="name"
              >
                {[0,1,2,3,4].map(i => <Cell key={i} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
