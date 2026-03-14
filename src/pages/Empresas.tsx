import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { empresasAPI, categoriasAPI, equipoAPI } from '../api/client';
import { Empresa, Category, TeamMember, EmpresaStatus, STATUS_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import {
  Plus, Search, Filter, Building2, Mail, Phone,
  MapPin, Eye, Pencil, Trash2, ChevronDown,
} from 'lucide-react';

const ALL_STATUSES: EmpresaStatus[] = ['prospecto', 'contactado', 'negociando', 'ganado', 'perdido'];

export default function Empresas() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterMember, setFilterM] = useState('');
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [showFilters, setShowF]   = useState(false);

  const params: Record<string, string> = {};
  if (search)       params.search      = search;
  if (filterStatus) params.status      = filterStatus;
  if (filterCat)    params.category_id = filterCat;
  if (filterMember) params.assigned_to = filterMember;

  const { data: empresas = [], isLoading } = useQuery<Empresa[]>({
    queryKey: ['empresas', params],
    queryFn: () => empresasAPI.getAll(params),
  });

  const { data: categorias = [] } = useQuery<Category[]>({
    queryKey: ['categorias'],
    queryFn: categoriasAPI.getAll,
  });

  const { data: equipo = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => empresasAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setDeleteId(null);
    },
  });

  const activeFilters = [filterStatus, filterCat, filterMember].filter(Boolean).length;

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{empresas.length} registros</p>
        </div>
        <Link to="/empresas/nueva" className="btn-primary">
          <Plus size={16} /> Nueva empresa
        </Link>
      </div>

      {/* Search & filters */}
      <div className="card p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar empresa, contacto, ubicación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowF(!showFilters)}
            className={`btn-secondary relative ${showFilters ? 'ring-2 ring-blue-500' : ''}`}
          >
            <Filter size={16} />
            Filtros
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="label">Estado</label>
              <select className="select" value={filterStatus} onChange={e => setFilter(e.target.value)}>
                <option value="">Todos</option>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Asignado a</label>
              <select className="select" value={filterMember} onChange={e => setFilterM(e.target.value)}>
                <option value="">Todos</option>
                {equipo.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : empresas.length === 0 ? (
        <div className="card p-16 text-center">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay empresas</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || activeFilters > 0
              ? 'Prueba con otros filtros'
              : 'Empieza agregando tu primera empresa'}
          </p>
          {!search && activeFilters === 0 && (
            <Link to="/empresas/nueva" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Agregar empresa
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Asignado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empresas.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{emp.company_name}</div>
                      {emp.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin size={11} /> {emp.location}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-gray-700">{emp.contact_name || '—'}</div>
                      {emp.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Phone size={11} /> {emp.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {emp.category_name ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: emp.category_color ?? '#6366F1' }}
                        >
                          {emp.category_name}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {emp.assigned_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={emp.assigned_name} color={emp.assigned_color} size="xs" />
                          <span className="text-gray-700 text-xs">{emp.assigned_name}</span>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/empresas/${emp.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          to={`/empresas/${emp.id}/editar`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(emp.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center">¿Eliminar empresa?</h3>
            <p className="text-gray-500 text-sm text-center mt-2">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button
                className="btn-danger flex-1 justify-center"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
