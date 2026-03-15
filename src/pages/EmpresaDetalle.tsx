import { useState, useRef, type ElementType, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasAPI, actividadesAPI, remindersAPI, equipoAPI, attachmentsAPI, pagosAPI } from '../api/client';
import {
  Empresa, Activity, Reminder, TeamMember, Attachment, Payment,
  EmpresaStatus, STATUS_LABELS, ACTION_LABELS, PRIORITY_LABELS, PRIORITY_COLORS,
  PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  formatGTQ,
} from '../types';
import type { Priority, PaymentType, PaymentStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin, Tag,
  User, Calendar, MessageSquare, Send, Bell, Plus,
  Check, AlertTriangle, Trash2, Shield, Briefcase,
  Paperclip, Download, FileText, Image, File,
  DollarSign, ExternalLink,
} from 'lucide-react';
import { useCurrentUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

const PRIORITIES_LIST: Priority[] = ['baja', 'media', 'alta', 'urgente'];
const PAYMENT_TYPES: PaymentType[] = ['cotizacion', 'pago'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pendiente', 'pagado', 'cancelado'];

function getWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '', description: '', due_date: '', priority: 'media' as Priority, team_member_id: '',
  });
  const [payForm, setPayForm] = useState({
    amount: '', concept: '', type: 'cotizacion' as PaymentType,
    status: 'pendiente' as PaymentStatus, date: new Date().toISOString().slice(0, 10), notes: '',
  });

  const { data, isLoading } = useQuery<Empresa & { activities: Activity[] }>({
    queryKey: ['empresa', id],
    queryFn: () => empresasAPI.getById(id!),
  });

  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders-empresa', id],
    queryFn: () => remindersAPI.getByEmpresa(id!),
  });

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['attachments', id],
    queryFn: () => attachmentsAPI.getByEmpresa(id!),
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['payments-empresa', id],
    queryFn: () => pagosAPI.getByEmpresa(id!),
  });

  const { data: equipo = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
  });

  const noteMutation = useMutation({
    mutationFn: () => actividadesAPI.create({
      empresa_id: id!, team_member_id: currentUser?.id ?? '', action: 'nota', notes: note,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresa', id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setNote('');
      toast('Nota agregada', 'success');
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: () => remindersAPI.create({
      ...reminderForm, empresa_id: id!,
      team_member_id: reminderForm.team_member_id || currentUser?.id || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders-empresa', id] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
      setShowAddReminder(false);
      setReminderForm({ title: '', description: '', due_date: '', priority: 'media', team_member_id: '' });
      toast('Recordatorio creado', 'success');
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

  // Attachments mutations
  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsAPI.upload(id!, file, currentUser?.id ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', id] });
      toast('Archivo adjuntado', 'success');
    },
    onError: () => toast('Error al subir archivo', 'error'),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attId: string) => attachmentsAPI.delete(attId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', id] });
      toast('Archivo eliminado', 'success');
    },
  });

  // Payments mutations
  const createPaymentMutation = useMutation({
    mutationFn: () => pagosAPI.create({
      empresa_id: id!, amount: parseFloat(payForm.amount) || 0,
      concept: payForm.concept, type: payForm.type, status: payForm.status,
      date: payForm.date, notes: payForm.notes, created_by: currentUser?.id ?? null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments-empresa', id] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      setShowAddPayment(false);
      setPayForm({ amount: '', concept: '', type: 'cotizacion', status: 'pendiente', date: new Date().toISOString().slice(0, 10), notes: '' });
      toast('Registro de pago creado', 'success');
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (pid: string) => pagosAPI.delete(pid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments-empresa', id] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      toast('Registro eliminado', 'success');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

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

  const totalPagado = payments.filter(p => p.type === 'pago' && p.status === 'pagado').reduce((s, p) => s + (p.amount || 0), 0);
  const totalCotizado = payments.filter(p => p.type === 'cotizacion').reduce((s, p) => s + (p.amount || 0), 0);

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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: empresa.category_color ?? '#6366F1' }}>
                  <Tag size={10} /> {empresa.category_name}
                </span>
              )}
              {empresa.service_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: empresa.service_color ?? '#8B5CF6' }}>
                  <Briefcase size={10} /> {empresa.service_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {empresa.phone && (
            <a
              href={getWhatsAppUrl(empresa.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              title="Abrir WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          <Link to={`/empresas/${id}/editar`} className="btn-secondary">
            <Pencil size={15} /> Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Información</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {empresa.contact_name && <InfoRow icon={User} label="Contacto" value={empresa.contact_name} />}
              {empresa.email && (
                <InfoRow icon={Mail} label="Email" value={
                  <a href={`mailto:${empresa.email}`} className="text-blue-600 hover:underline">{empresa.email}</a>
                } />
              )}
              {empresa.phone && (
                <InfoRow icon={Phone} label="Teléfono" value={
                  <span className="flex items-center gap-2">
                    <a href={`tel:${empresa.phone}`} className="text-blue-600 hover:underline">{empresa.phone}</a>
                    <a href={getWhatsAppUrl(empresa.phone)} target="_blank" rel="noopener noreferrer"
                       className="text-green-500 hover:text-green-600" title="WhatsApp">
                      <ExternalLink size={12} />
                    </a>
                  </span>
                } />
              )}
              {empresa.location && <InfoRow icon={MapPin} label="Ubicación" value={empresa.location} />}
              {empresa.assigned_name && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Asignado a</p>
                  <div className="flex items-center gap-2">
                    <Avatar name={empresa.assigned_name} color={empresa.assigned_color} size="xs" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{empresa.assigned_name}</span>
                  </div>
                </div>
              )}
              {empresa.servicio_solicitado && <InfoRow icon={Briefcase} label="Servicio solicitado" value={empresa.servicio_solicitado} />}
              <InfoRow icon={Calendar} label="Registrado" value={
                new Date(empresa.created_at).toLocaleDateString('es-GT', { dateStyle: 'long' })
              } />
            </div>

            {empresa.details && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Detalles</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{empresa.details}</p>
              </div>
            )}

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

          {/* Pagos / Cotizaciones */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <DollarSign size={16} className="text-green-500" /> Pagos y Cotizaciones
              </h2>
              <button className="btn-secondary text-xs px-2.5 py-1.5" onClick={() => setShowAddPayment(true)}>
                <Plus size={14} /> Agregar
              </button>
            </div>

            {payments.length > 0 && (
              <div className="flex gap-4 mb-3 text-xs">
                <span className="text-gray-500">Cotizado: <strong className="text-blue-600">{formatGTQ(totalCotizado)}</strong></span>
                <span className="text-gray-500">Cobrado: <strong className="text-green-600">{formatGTQ(totalPagado)}</strong></span>
              </div>
            )}

            {payments.length === 0 ? (
              <p className="text-sm text-gray-400">Sin registros de pagos/cotizaciones.</p>
            ) : (
              <div className="space-y-2">
                {payments.map(p => {
                  const sc = PAYMENT_STATUS_COLORS[p.status as PaymentStatus] ?? PAYMENT_STATUS_COLORS.pendiente;
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.type === 'pago' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        <DollarSign size={14} className={p.type === 'pago' ? 'text-green-600' : 'text-blue-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.concept}</p>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sc.bg} ${sc.text}`}>
                            {PAYMENT_STATUS_LABELS[p.status as PaymentStatus]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span>{PAYMENT_TYPE_LABELS[p.type as PaymentType]}</span>
                          <span>{new Date(p.date).toLocaleDateString('es-GT')}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">{formatGTQ(p.amount)}</p>
                      <button onClick={() => deletePaymentMutation.mutate(p.id)} className="p-1 rounded text-gray-400 hover:text-red-500 flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Archivos adjuntos */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <Paperclip size={16} className="text-indigo-500" /> Archivos adjuntos
              </h2>
              <button className="btn-secondary text-xs px-2.5 py-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                <Plus size={14} /> {uploadMutation.isPending ? 'Subiendo...' : 'Adjuntar'}
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>

            {attachments.length === 0 ? (
              <p className="text-sm text-gray-400">Sin archivos adjuntos.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => {
                  const FileIcon = getFileIcon(att.file_type);
                  return (
                    <div key={att.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <FileIcon size={14} className="text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{att.file_name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{formatFileSize(att.file_size)}</span>
                          {att.uploader_name && <span>por {att.uploader_name}</span>}
                          <span>{new Date(att.created_at).toLocaleDateString('es-GT')}</span>
                        </div>
                      </div>
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                         className="p-1.5 rounded text-gray-400 hover:text-blue-600 flex-shrink-0" title="Descargar">
                        <Download size={14} />
                      </a>
                      <button onClick={() => deleteAttachmentMutation.mutate(att.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-500 flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
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
                        <p className={`text-sm font-medium ${r.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{r.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded ${rpColors.bg} ${rpColors.text}`}>
                            {PRIORITY_LABELS[(r.priority || 'media') as Priority]}
                          </span>
                          <span className={overdue ? 'text-red-500 font-medium' : ''}>
                            <Calendar size={10} className="inline mr-0.5" />
                            {new Date(r.due_date).toLocaleDateString('es-GT')}
                            {overdue && ' (Vencido)'}
                          </span>
                          {r.member_name && (
                            <span className="flex items-center gap-1">
                              <Avatar name={r.member_name} color={r.member_color} size="xs" /> {r.member_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteReminderMutation.mutate(r.id)} className="p-1 rounded text-gray-400 hover:text-red-500 flex-shrink-0">
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
              <textarea className="textarea flex-1" rows={2} placeholder="Escribe una nota sobre esta empresa..." value={note} onChange={e => setNote(e.target.value)} />
              <button className="btn-primary self-end" onClick={() => noteMutation.mutate()} disabled={!note.trim() || noteMutation.isPending || !currentUser}>
                <Send size={16} />
              </button>
            </div>
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
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-white text-xs font-bold"
                         style={{ backgroundColor: act.member_color ?? '#94A3B8' }}>
                      {act.member_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{act.member_name ?? 'Sistema'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.notes}</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                        {new Date(act.created_at).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}
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
            <input className="input" placeholder="Ej. Llamar para seguimiento" value={reminderForm.title} onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="textarea" rows={2} placeholder="Detalles..." value={reminderForm.description} onChange={e => setReminderForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha límite *</label>
              <input type="date" className="input" value={reminderForm.due_date} onChange={e => setReminderForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select className="select" value={reminderForm.priority} onChange={e => setReminderForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                {PRIORITIES_LIST.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Asignado a</label>
            <select className="select" value={reminderForm.team_member_id} onChange={e => setReminderForm(f => ({ ...f, team_member_id: e.target.value }))}>
              <option value="">Yo ({currentUser?.name || 'sin seleccionar'})</option>
              {equipo.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setShowAddReminder(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => createReminderMutation.mutate()} disabled={!reminderForm.title.trim() || !reminderForm.due_date || createReminderMutation.isPending}>
              {createReminderMutation.isPending ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal open={showAddPayment} onClose={() => setShowAddPayment(false)} title="Nuevo pago/cotización">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monto (GTQ) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Q</span>
                <input className="input pl-7" type="number" step="0.01" min="0" placeholder="0.00" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Fecha *</label>
              <input type="date" className="input" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Concepto *</label>
            <input className="input" placeholder="Ej. Cotización diseño web" value={payForm.concept} onChange={e => setPayForm(f => ({ ...f, concept: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={payForm.type} onChange={e => setPayForm(f => ({ ...f, type: e.target.value as PaymentType }))}>
                {PAYMENT_TYPES.map(t => <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="select" value={payForm.status} onChange={e => setPayForm(f => ({ ...f, status: e.target.value as PaymentStatus }))}>
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="textarea" rows={2} placeholder="Observaciones..." value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setShowAddPayment(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => createPaymentMutation.mutate()} disabled={!payForm.concept.trim() || !payForm.amount || createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
        <Icon size={11} /> {label}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  );
}
