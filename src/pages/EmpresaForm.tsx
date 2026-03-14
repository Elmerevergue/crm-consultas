import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasAPI, categoriasAPI, equipoAPI } from '../api/client';
import { Category, TeamMember, EmpresaStatus, STATUS_LABELS } from '../types';
import { useCurrentUser } from '../context/UserContext';
import { ArrowLeft, Save, Building2 } from 'lucide-react';

const STATUSES: EmpresaStatus[] = ['prospecto', 'contactado', 'negociando', 'ganado', 'perdido'];

const EMPTY = {
  company_name: '', contact_name: '', email: '', phone: '',
  category_id: '', location: '', details: '', status: 'prospecto' as EmpresaStatus,
  assigned_to: '',
};

export default function EmpresaForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const { data: categorias = [] } = useQuery<Category[]>({
    queryKey: ['categorias'],
    queryFn: categoriasAPI.getAll,
  });

  const { data: equipo = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
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
      });
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
      created_by:  currentUser?.id ?? null,
      updated_by:  currentUser?.id ?? null,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="page-title">{isEdit ? 'Editar empresa' : 'Nueva empresa'}</h1>
          <p className="text-gray-500 text-sm">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Estado</label>
              <select className="select" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
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
