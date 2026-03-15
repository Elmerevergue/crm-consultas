export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  color: string;
  price: string;
  active: boolean;
  created_at: string;
}

export type EmpresaStatus = 'prospecto' | 'contactado' | 'negociando' | 'ganado' | 'perdido';
export type Priority = 'baja' | 'media' | 'alta' | 'urgente';

export interface Empresa {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  category_id: string | null;
  location: string;
  details: string;
  status: EmpresaStatus;
  priority: Priority;
  assigned_to: string | null;
  created_by: string | null;
  service_id: string | null;
  servicio_solicitado: string;
  custom_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
  // joined
  category_name?: string;
  category_color?: string;
  assigned_name?: string;
  assigned_color?: string;
  created_by_name?: string;
  service_name?: string;
  service_color?: string;
}

export interface Activity {
  id: string;
  empresa_id: string;
  team_member_id: string;
  action: string;
  notes: string;
  created_at: string;
  member_name?: string;
  member_color?: string;
  company_name?: string;
}

export interface Reminder {
  id: string;
  empresa_id: string;
  team_member_id: string | null;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  priority: Priority;
  created_at: string;
  // joined
  empresa_name?: string;
  member_name?: string;
  member_color?: string;
}

export interface MemberStat {
  id: string;
  name: string;
  color: string;
  total: number;
  ganados: number;
  negociando: number;
  perdidos: number;
  prospectos: number;
  contactados: number;
}

export interface Stats {
  totals: {
    totalEmpresas: number;
    ganadas: number;
    enNegociacion: number;
    perdidas: number;
    prospectos: number;
    contactados: number;
  };
  memberStats: MemberStat[];
  categoryStats: Array<{ name: string; color: string; total: number; ganados: number }>;
  serviceStats: Array<{ name: string; color: string; total: number; ganados: number; negociando: number }>;
  recentActivity: Activity[];
  trend: Array<{ month: string; total: number; ganadas: number }>;
  conversionRate: string;
}

export const STATUS_LABELS: Record<EmpresaStatus, string> = {
  prospecto:  'Prospecto',
  contactado: 'Contactado',
  negociando: 'Negociando',
  ganado:     'Ganado',
  perdido:    'Perdido',
};

export const STATUS_COLORS: Record<EmpresaStatus, { bg: string; text: string; dot: string }> = {
  prospecto:  { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400' },
  contactado: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  negociando: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  ganado:     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  perdido:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baja:    'Baja',
  media:   'Media',
  alta:    'Alta',
  urgente: 'Urgente',
};

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; dot: string }> = {
  baja:    { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
  media:   { bg: 'bg-blue-100',   text: 'text-blue-600',   dot: 'bg-blue-400' },
  alta:    { bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-500' },
  urgente: { bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500' },
};

export const ACTION_LABELS: Record<string, string> = {
  creado:          'Empresa registrada',
  estado_cambiado: 'Estado actualizado',
  nota:            'Nota agregada',
  contacto:        'Contacto realizado',
};

export const STATUS_ORDER: EmpresaStatus[] = ['prospecto', 'contactado', 'negociando', 'ganado', 'perdido'];

// ── Archivos adjuntos ──
export interface Attachment {
  id: string;
  empresa_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
  uploader_name?: string;
}

// ── Pagos / Cotizaciones ──
export type PaymentType = 'cotizacion' | 'pago';
export type PaymentStatus = 'pendiente' | 'pagado' | 'cancelado';

export interface Payment {
  id: string;
  empresa_id: string;
  amount: number;
  concept: string;
  type: PaymentType;
  status: PaymentStatus;
  date: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  empresa_name?: string;
  creator_name?: string;
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cotizacion: 'Cotización',
  pago: 'Pago',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  pendiente: { bg: 'bg-amber-100', text: 'text-amber-700' },
  pagado:    { bg: 'bg-green-100', text: 'text-green-700' },
  cancelado: { bg: 'bg-red-100',   text: 'text-red-700' },
};

// ── Plantillas de mensajes ──
export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

// ── Formato moneda GTQ ──
export function formatGTQ(amount: number): string {
  return `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
