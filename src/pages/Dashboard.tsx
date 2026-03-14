import type { ElementType, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../api/client';
import { Stats, STATUS_COLORS } from '../types';
import Avatar from '../components/Avatar';
import {
  Building2, TrendingUp, Trophy, Clock,
  CheckCircle2, MessageSquare, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: ElementType; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const ACTION_ICONS: Record<string, ElementType> = {
  creado: Building2,
  estado_cambiado: RefreshCw,
  nota: MessageSquare,
  contacto: MessageSquare,
};

const PIE_COLORS: Record<string, string> = {
  prospecto:  '#9CA3AF',
  contactado: '#3B82F6',
  negociando: '#F59E0B',
  ganado:     '#10B981',
  perdido:    '#EF4444',
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: statsAPI.get,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { totals, memberStats, categoryStats, serviceStats, recentActivity, trend, conversionRate } = stats;

  const pieData = [
    { name: 'Prospecto',  value: totals.prospectos,    key: 'prospecto' },
    { name: 'Contactado', value: totals.contactados,   key: 'contactado' },
    { name: 'Negociando', value: totals.enNegociacion, key: 'negociando' },
    { name: 'Ganado',     value: totals.ganadas,       key: 'ganado' },
    { name: 'Perdido',    value: totals.perdidas,      key: 'perdido' },
  ].filter(d => d.value > 0);

  const trendFormatted = trend.map(t => ({
    ...t,
    month: t.month.slice(5), // MM
  }));

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general del equipo</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Empresas"  value={totals.totalEmpresas}  icon={Building2}    color="bg-blue-600"   sub="en seguimiento" />
        <StatCard label="Ganadas"         value={totals.ganadas}        icon={CheckCircle2} color="bg-green-500"  sub="clientes captados" />
        <StatCard label="En Negociación"  value={totals.enNegociacion}  icon={TrendingUp}   color="bg-amber-500"  sub="en proceso" />
        <StatCard label="Tasa Conversión" value={`${conversionRate}%`}  icon={Trophy}       color="bg-indigo-600" sub="prospectos → ganados" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="section-title mb-4">Tendencia últimos 6 meses</h2>
          {trendFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendFormatted} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total"   name="Registradas" fill="#93C5FD" radius={[3,3,0,0]} />
                <Bar dataKey="ganadas" name="Ganadas"      fill="#10B981" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sin datos suficientes aún
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Por estado</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                     dataKey="value" nameKey="name">
                  {pieData.map(entry => (
                    <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Team + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top performers */}
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" /> Ranking del equipo
          </h2>
          <div className="space-y-3">
            {memberStats.length === 0 && (
              <p className="text-sm text-gray-400">Sin miembros aún</p>
            )}
            {memberStats.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className={`text-sm font-bold w-5 text-center
                  ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {i + 1}
                </span>
                <Avatar name={m.name} color={m.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">{m.name}</span>
                    <span className="text-sm font-bold text-green-600 ml-2">{m.ganados} ✓</span>
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-gray-400">
                    <span>{m.total} total</span>
                    <span>·</span>
                    <span className="text-amber-600">{m.negociando} neg.</span>
                    <span>·</span>
                    <span className="text-gray-400">{m.prospectos} prosp.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> Actividad reciente
          </h2>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-sm text-gray-400">Sin actividad registrada</p>
            )}
            {recentActivity.slice(0, 8).map(act => {
              const Icon = ACTION_ICONS[act.action] ?? RefreshCw;
              return (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={13} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{act.member_name ?? 'Alguien'}</span>
                      {' — '}
                      <span className="text-gray-500 truncate">{act.company_name}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{act.notes}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(act.created_at).toLocaleString('es-MX', {
                        dateStyle: 'short', timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service stats */}
      {serviceStats && serviceStats.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Clientes por servicio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {serviceStats.map(svc => (
              <div key={svc.name} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: svc.color }}
                />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{svc.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{svc.total}</p>
                <p className="text-xs text-green-600 mt-0.5">{svc.ganados} ganados</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category stats */}
      {categoryStats.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Clientes por categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categoryStats.map(cat => (
              <div key={cat.name} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: cat.color }}
                />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{cat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{cat.total}</p>
                <p className="text-xs text-green-600 mt-0.5">{cat.ganados} ganadas</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
