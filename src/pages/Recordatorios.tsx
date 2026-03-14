import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersAPI, empresasAPI, equipoAPI } from '../api/client';
import { Reminder, Empresa, TeamMember, PRIORITY_LABELS, PRIORITY_COLORS } from '../types';
import type { Priority } from '../types';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { useCurrentUser } from '../context/UserContext';
import {
  Plus, Bell, Check, Clock, Trash2, Calendar,
  AlertTriangle, Building2, Filter,
} from 'lucide-react';

const PRIORITIES: Priority[] = ['baja', 'media', 'alta', 'urgente'];

export default function Recordatorios() {
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [filterMember, setFilterMember] = useState('');

  const filters: { completed?: boolean; member_id?: string } = {
    completed: tab === 'done',
  };
  if (filterMember) filters.member_id = filterMember;

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ['reminders', filters],
    queryFn: () => remindersAPI.getAll(filters),
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ['empresas', {}],
    queryFn: () => empresasAPI.getAll(),
  });

  const { data: equipo = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      remindersAPI.toggleComplete(id, completed),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remindersAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const [form, setForm] = useState({
    empresa_id: '',
    title: '',
    description: '',
    due_date: '',
    priority: 'media' as Priority,
    team_member_id: currentUser?.id ?? '',
  });

  const createMutation = useMutation({
    mutationFn: () => remindersAPI.create({
      ...form,
      team_member_id: form.team_member_id || null,
      empresa_id: form.empresa_id || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      setShowAdd(false);
      setForm({ empresa_id: '', title: '', description: '', due_date: '', priority: 'media', team_member_id: currentUser?.id ?? '' });
    },
  });

  const isOverdue = (date: string) => new Date(date) < new Date() ;
  const isToday = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const pendingCount = reminders.length;
  const overdueCount = tab === 'pending' ? reminders.filter(r => isOverdue(r.due_date)).length : 0;

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Recordatorios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {pendingCount} {tab === 'pending' ? 'pendientes' : 'completados'}
            {overdueCount > 0 && (
              <span className="text-red-500 ml-2">({overdueCount} vencidos)</span>
            )}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Nuevo recordatorio
        </button>
      </div>

      {/* Tabs + filters */}
      <div className="card p-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setTab('pending')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'pending'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Clock size={14} className="inline mr-1.5" /> Pendientes
            </button>
            <button
              onClick={() => setTab('done')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'done'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Check size={14} className="inline mr-1.5" /> Completados
            </button>
          </div>

          <select
            className="select max-w-[200px]"
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
          >
            <option value="">Todos los miembros</option>
            {equipo.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {tab === 'pending' ? 'No hay recordatorios pendientes' : 'No hay completados'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map(r => {
            const overdue = !r.completed && isOverdue(r.due_date);
            const today = isToday(r.due_date);
            const pColors = PRIORITY_COLORS[r.priority as Priority] ?? PRIORITY_COLORS.media;

            return (
              <div
                key={r.id}
                className={`card p-4 flex items-start gap-3 transition-colors ${
                  overdue ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' : ''
                } ${r.completed ? 'opacity-60' : ''}`}
              >
                {/* Check circle */}
                <button
                  onClick={() => toggleMutation.mutate({ id: r.id, completed: !r.completed })}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    r.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                  }`}
                >
                  {r.completed && <Check size={12} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium text-sm ${r.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {r.title}
                    </p>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${pColors.bg} ${pColors.text}`}>
                      {PRIORITY_LABELS[r.priority as Priority] ?? r.priority}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className={`flex items-center gap-1 text-xs ${
                      overdue ? 'text-red-500 font-medium' : today ? 'text-amber-500 font-medium' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      <Calendar size={11} />
                      {overdue && <AlertTriangle size={11} />}
                      {new Date(r.due_date).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                      {today && ' (Hoy)'}
                      {overdue && ' (Vencido)'}
                    </div>

                    {r.empresa_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Building2 size={11} /> {r.empresa_name}
                      </div>
                    )}

                    {r.member_name && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={r.member_name} color={r.member_color} size="xs" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{r.member_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteMutation.mutate(r.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo recordatorio">
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input
              className="input"
              placeholder="Ej. Llamar para seguimiento"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Detalles adicionales..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha límite *</label>
              <input
                type="date"
                className="input"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select
                className="select"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Empresa</label>
              <select
                className="select"
                value={form.empresa_id}
                onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}
              >
                <option value="">Ninguna</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Asignado a</label>
              <select
                className="select"
                value={form.team_member_id}
                onChange={e => setForm(f => ({ ...f, team_member_id: e.target.value }))}
              >
                <option value="">Sin asignar</option>
                {equipo.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={() => createMutation.mutate()}
              disabled={!form.title.trim() || !form.due_date || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear recordatorio'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
