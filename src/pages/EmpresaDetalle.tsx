import { useState, type ElementType, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasAPI, actividadesAPI } from '../api/client';
import { Empresa, Activity, EmpresaStatus, STATUS_LABELS, ACTION_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin, Tag,
  User, Calendar, MessageSquare, Send,
} from 'lucide-react';
import { useCurrentUser } from '../context/UserContext';

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery<Empresa & { activities: Activity[] }>({
    queryKey: ['empresa', id],
    queryFn: () => empresasAPI.getById(id!),
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Empresa no encontrada.</p>;

  const empresa = data as Empresa & { activities: Activity[] };

  return (
    <div className="max-w-4xl mx-auto space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{empresa.company_name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <StatusBadge status={empresa.status as EmpresaStatus} />
              {empresa.category_name && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: empresa.category_color ?? '#6366F1' }}
                >
                  <Tag size={10} /> {empresa.category_name}
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
                    <span className="text-sm text-gray-700">{empresa.assigned_name}</span>
                  </div>
                </div>
              )}
              <InfoRow icon={Calendar} label="Registrado" value={
                new Date(empresa.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })
              } />
            </div>

            {empresa.details && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Detalles</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{empresa.details}</p>
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
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />
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
                      <p className="text-sm font-medium text-gray-800">
                        {act.member_name ?? 'Sistema'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{act.notes}</p>
                      <p className="text-xs text-gray-300 mt-1">
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
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}
