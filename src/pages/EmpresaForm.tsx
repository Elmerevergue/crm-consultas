import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasAPI, categoriasAPI, equipoAPI, serviciosAPI } from '../api/client';
import { Category, TeamMember, Service, EmpresaStatus, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import type { Priority } from '../types';
import { useCurrentUser } from '../context/UserContext';
import { ArrowLeft, Save, Building2, Plus, Trash2 } from 'lucide-react';

const STATUSES: EmpresaStatus[] = ['prospecto', 'contactado', 'negociando', 'ganado', 'perdido'];
const PRIORITIES: Priority[] = ['baja', 'media', 'alta', 'urgente'];

const EMPTY = {
  company_name: '', contact_name: '', email: '', phone: '',
  category_id: '', location: '', details: '', status: 'prospecto' as EmpresaStatus,
  assigned_to: '', priority: 'media' as Priority,
  service_id: '', servicio_solicitado: '',
};

export default function EmpresaForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();

  const [form, setForm] = useState(EMPTY);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [error, setError] = useState('');

  const { data: categorias = [] } = useQuery<Category[]>({
    queryKey: ['categorias'],
    queryFn: categoriasAPI.getAll,
  });

  const { data: equipo = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
  });

  const { data: servicios = [] } = useQuery<Service[]>({
    queryKey: ['servicios-activos'],
    queryFn: serviciosAPI.getActive,
  });

  const { data: empresa } = useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresasAPI.getById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (empresa) {
      setForm({
        company_name: empresa.company_name ?? '',
        contact_name: empresa.contact_name ?? '',
        email:        empresa.email ?? '',
        phone:        empresa.phone ?? '',
        category_id:  empresa.category_id ?? '',
        location:     empresa.location ?? '',
        details:      empresa.details ?? '',
        status:       empresa.status ?? 'prospecto',
        assigned_to:  empresa.assigned_to ?? '',
        priority:     empresa.priority ?? 'media',
        service_id:   empresa.service_id ?? '',
        servicio_solicitado: empresa.servicio_solicitado ?? '',
      });
      if (empresa.custom_fields && typeof empresa.custom_fields === 'object') {
        setCustomFields(empresa.custom_fields as Record<string, string>);
      }
    }
  }, [empresa]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? empresasAPI.update(id!, data) : empresasAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      navigate('/empresas');
    },
    onError: () => setError('Error al guardar. Verifica los datos.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.company_name.trim()) { setError('El nombre de la empresa es requerido.'); return; }
    saveMutation.mutate({
      ...form,
      category_id: form.category_id || null,
      assigned_to: form.assigned_to || null,
      service_id:  form.service_id || null,
      servicio_solicitado: form.servicio_solicitado,
      created_by:  currentUser?.id ?? null,
      updated_by:  currentUser?.id ?? null,
      custom_fields: customFields,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const addCustomField = () => {
    const key = newFieldKey.trim();
    if (key && !customFields[key]) {
      setCustomFields(prev => ({ ...prev, [key]: '' }));
      setNewFieldKey('');
    }
  };

  const removeCustomField = (key: string) => {
    setCustomFields(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="max-w-2xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <Building2 size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="page-title">{isEdit ? 'Editar empresa' : 'Nueva empresa'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isEdit ? 'Actualiza la información' : 'Registra una nueva empresa'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos principales */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Información de la empresa</h2>

          <div>
            <label className="label">Nombre de la empresa *</label>
            <input className="input" placeholder="Ej. Tech Solutions S.A." value={form.company_name} onChange={set('company_name')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo / Categoría</label>
              <select className="select" value={form.category_id} onChange={set('category_id')}>
                <option value="">Sin categoría</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ubicación</label>
              <input className="input" placeholder="Ciudad, Estado" value={form.location} onChange={set('location')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Servicio solicitado</label>
              <select className="select" value={form.service_id} onChange={set('service_id')}>
                <option value="">Sin servicio</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Detalle del servicio</label>
              <input className="input" placeholder="Especificaciones del servicio solicitado..." value={form.servicio_solicitado} onChange={set('servicio_solicitado')} />
            </div>
          </div>

          <div>
            <label className="label">Detalles / Descripción</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Descripción del negocio, productos, observaciones..."
              value={form.details}
              onChange={set('details')}
            />
          </div>
        </div>

        {/* Contacto */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Información de contacto</h2>

          <div>
            <label className="label">Nombre del contacto</label>
            <input className="input" placeholder="Ej. Juan Pérez" value={form.contact_name} onChange={set('contact_name')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="contacto@empresa.com" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" type="tel" placeholder="+52 55 1234 5678" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
        </div>

        {/* Gestión */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Gestión</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Estado</label>
              <select className="select" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select className="select" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Asignado a</label>
              <select className="select" value={form.assigned_to} onChange={set('assigned_to')}>
                <option value="">Sin asignar</option>
                {equipo.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {currentUser && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: currentUser.color }} />
              Registrado por: <strong>{currentUser.name}</strong>
            </p>
          )}
        </div>

        {/* Campos personalizados */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Campos personalizados</h2>
          <p className="text-xs text-gray-400">Agrega información adicional específica de esta empresa.</p>

          {Object.entries(customFields).map(([key, val]) => (
            <div key={key} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="label">{key}</label>
                <input
                  className="input"
                  value={val}
                  onChange={e => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Valor de ${key}`}
                />
              </div>
              <button
                type="button"
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={() => removeCustomField(key)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nombre del campo (ej. Sitio Web, RFC, etc.)"
              value={newFieldKey}
              onChange={e => setNewFieldKey(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomField(); } }}
            />
            <button type="button" className="btn-secondary" onClick={addCustomField} disabled={!newFieldKey.trim()}>
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
            <Save size={16} />
            {saveMutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar empresa'}
          </button>
        </div>
      </form>
    </div>
  );
}
