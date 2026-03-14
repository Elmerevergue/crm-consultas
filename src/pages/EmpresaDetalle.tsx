import { useState, type ElementType, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasAPI, actividadesAPI, remindersAPI, equipoAPI } from '../api/client';
import { Empresa, Activity, Reminder, TeamMember, EmpresaStatus, STATUS_LABELS, ACTION_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '../types';
import type { Priority } from '../types';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin, Tag,
  User, Calendar, MessageSquare, Send, Bell, Plus,
  Check, AlertTriangle, Clock, Trash2, Shield, Briefcase,
} from 'lucide-react';
import { useCurrentUser } from '../context/UserContext';

const PRIORITIES_LIST: Priority[] = ['baja', 'media', 'alta', 'urgente'];

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [note, setNote] = useState('');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '', description: '', due_date: '', priority: 'media' as Priority, team_member_id: '',
  });

  const { data, isLoading } = useQuery<Empresa & { activities: Activity[] }>({
    queryKey: ['empresa', id],
    queryFn: () => empresasAPI.getById(id!),
  });

  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders-empresa', id],
    queryFn: () => remindersAPI.getByEmpresa(id!),
  });

  const { data: equipo = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
  });

  const noteMutation = useMutation({
    mutationFn: () => actividadesAPI.create({
      empresa_id:     id!,
      team_member_id: currentUser?.id ?? '',
      action:         'nota',
      notes:          note,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresa', id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setNote('');
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: () => remindersAPI.create({
      ...reminderForm,
      empresa_id: id!,
      team_member_id: reminderForm.team_member_id || currentUser?.id || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders-empresa', id] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
      setShowAddReminder(false);
      setReminderForm({ title: '', description: '', due_date: '', priority: 'media', team_member_id: '' });
    },
  });

  const toggleReminderMutation = useMutation({
    mutationFn: ({ rid, completed }: { rid: string; completed: boolean }) =>
      remindersAPI.toggleComplete(rid, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders-empresa', id] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (rid: string) => remindersAPI.delete(rid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders-empresa', id] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Empresa no encontrada.</p>;

  const empresa = data as Empresa & { activities: Activity[] };
  const prio = (empresa.priority || 'media') as Priority;
  const pColors = PRIORITY_COLORS[prio];
  const customFields = (empresa.custom_fields && typeof empresa.custom_fields === 'object')
    ? empresa.custom_fields as Record<string, string>
    : {};

  return (
    <div className="max-w-4xl mx-auto space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{empresa.company_name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <StatusBadge status={empresa.status as EmpresaStatus} />
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pColors.bg} ${pColors.text}`}>
                {prio === 'urgente' && <AlertTriangle size={10} />}
                <Shield size={10} /> {PRIORITY_LABELS[prio]}
              </span>
              {empresa.category_name && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: empresa.category_color ?? '#6366F1' }}
                >
                  <Tag size={10} /> {empresa.category_name}
                </span>
              )}
              {empresa.service_name && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: empresa.service_color ?? '#8B5CF6' }}
                >
                  <Briefcase size={10} /> {empresa.service_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link to={`/empresas/${id}/editar`} className="btn-secondary">
          <Pencil size={15} /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Información</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {empresa.contact_name && (
                <InfoRow icon={User} label="Contacto" value={empresa.contact_name} />
              )}
              {empresa.email && (
                <InfoRow icon={Mail} label="Email" value={
                  <a href={`mailto:${empresa.email}`} className="text-blue-600 hover:underline">{empresa.email}</a>
                } />
              )}
              {empresa.phone && (
                <InfoRow icon={Phone} label="Teléfono" value={
                  <a href={`tel:${empresa.phone}`} className="text-blue-600 hover:underline">{empresa.phone}</a>
                } />
              )}
              {empresa.location && (
                <InfoRow icon={MapPin} label="Ubicación" value={empresa.location} />
              )}
              {empresa.assigned_name && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Asignado a</p>
                  <div className="flex items-center gap-2">
                    <Avatar name={empresa.assigned_name} color={empresa.assigned_color} size="xs" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{empresa.assigned_name}</span>
                  </div>
                </div>
              )}
              {empresa.servicio_solicitado && (
                <InfoRow icon={Briefcase} label="Servicio solicitado" value={empresa.servicio_solicitado} />
              )}
              <InfoRow icon={Calendar} label="Registrado" value={
                new Date(empresa.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })
              } />
            </div>

            {empresa.details && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Detalles</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{empresa.details}</p>
              </div>
            )}

            {/* Custom fields */}
            {Object.keys(customFields).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Campos personalizados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(customFields).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-400 font-medium">{key}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{val || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reminders */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <Bell size={16} className="text-amber-500" /> Recordatorios
              </h2>
              <button className="btn-secondary text-xs px-2.5 py-1.5" onClick={() => setShowAddReminder(true)}>
                <Plus size={14} /> Agregar
              </button>
            </div>

            {reminders.length === 0 ? (
              <p className="text-sm text-gray-400">Sin recordatorios para esta empresa.</p>
            ) : (
              <div className="space-y-2">
                {reminders.map(r => {
                  const overdue = !r.completed && new Date(r.due_date) < new Date();
                  const rpColors = PRIORITY_COLORS[(r.priority || 'media') as Priority];
                  return (
                    <div key={r.id} className={`flex items-start gap-2 p-2 rounded-lg ${overdue ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-gray-700/50'} ${r.completed ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => toggleReminderMutation.mutate({ rid: r.id, completed: !r.completed })}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          r.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-500 hover:border-blue-500'
                        }`}
                      >
                        {r.completed && <Check size={10} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${r.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {r.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded ${rpColors.bg} ${rpColors.text}`}>
                            {PRIORITY_LABELS[(r.priority || 'media') as Priority]}
                          </span>
                          <span className={overdue ? 'text-red-500 font-medium' : ''}>
                            <Calendar size={10} className="inline mr-0.5" />
                            {new Date(r.due_date).toLocaleDateString('es-MX')}
                            {overdue && ' (Vencido)'}
                          </span>
                          {r.member_name && (
                            <span className="flex items-center gap-1">
                              <Avatar name={r.member_name} color={r.member_color} size="xs" />
                              {r.member_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteReminderMutation.mutate(r.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note input */}
          <div className="card p-5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" /> Agregar nota
            </h2>
            <div className="flex gap-2">
              <textarea
                className="textarea flex-1"
                rows={2}
                placeholder="Escribe una nota sobre esta empresa..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <button
                className="btn-primary self-end"
                onClick={() => noteMutation.mutate()}
                disabled={!note.trim() || noteMutation.isPending || !currentUser}
                title={!currentUser ? 'Selecciona tu usuario primero' : ''}
              >
                <Send size={16} />
              </button>
            </div>
            {!currentUser && (
              <p className="text-xs text-amber-600 mt-2">
                Selecciona tu usuario en la barra lateral para agregar notas.
              </p>
            )}
          </div>
        </div>

        {/* Activity timeline */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Historial</h2>
          {empresa.activities.length === 0 ? (
            <p className="text-sm text-gray-400">Sin actividad registrada.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-4">
                {empresa.activities.map(act => (
                  <div key={act.id} className="flex gap-3 relative">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-white text-xs font-bold"
                      style={{ backgroundColor: act.member_color ?? '#94A3B8' }}
                    >
                      {act.member_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {act.member_name ?? 'Sistema'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.notes}</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                        {new Date(act.created_at).toLocaleString('es-MX', {
                          dateStyle: 'short', timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Reminder Modal */}
      <Modal open={showAddReminder} onClose={() => setShowAddReminder(false)} title="Nuevo recordatorio">
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input className="input" placeholder="Ej. Llamar para seguimiento"
              value={reminderForm.title}
              onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="textarea" rows={2} placeholder="Detalles..."
              value={reminderForm.description}
              onChange={e => setReminderForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha límite *</label>
              <input type="date" className="input"
                value={reminderForm.due_date}
                onChange={e => setReminderForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select className="select"
                value={reminderForm.priority}
                onChange={e => setReminderForm(f => ({ ...f, priority: e.target.value as Priority }))}
              >
                {PRIORITIES_LIST.map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Asignado a</label>
            <select className="select"
              value={reminderForm.team_member_id}
              onChange={e => setReminderForm(f => ({ ...f, team_member_id: e.target.value }))}
            >
              <option value="">Yo ({currentUser?.name || 'sin seleccionar'})</option>
              {equipo.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setShowAddReminder(false)}>Cancelar</button>
            <button className="btn-primary"
              onClick={() => createReminderMutation.mutate()}
              disabled={!reminderForm.title.trim() || !reminderForm.due_date || createReminderMutation.isPending}
            >
              {createReminderMutation.isPending ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value,
}: {
  icon: ElementType; label: string; value: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
        <Icon size={11} /> {label}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  );
}
