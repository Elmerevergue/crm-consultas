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

export type EmpresaStatus = 'prospecto' | 'contactado' | 'negociando' | 'ganado' | 'perdido';

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
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category_name?: string;
  category_color?: string;
  assigned_name?: string;
  assigned_color?: string;
  created_by_name?: string;
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

export const ACTION_LABELS: Record<string, string> = {
  creado:          'Empresa registrada',
  estado_cambiado: 'Estado actualizado',
  nota:            'Nota agregada',
  contacto:        'Contacto realizado',
};
