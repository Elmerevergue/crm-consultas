import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { empresasAPI, categoriasAPI, equipoAPI, serviciosAPI } from '../api/client';
import { Empresa, Category, TeamMember, Service, EmpresaStatus, STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '../types';
import type { Priority } from '../types';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import {
  Plus, Search, Filter, Building2, Phone,
  MapPin, Eye, Pencil, Trash2, Download, Calendar,
  AlertTriangle, Briefcase,
} from 'lucide-react';

const ALL_STATUSES: EmpresaStatus[] = ['prospecto', 'contactado', 'negociando', 'ganado', 'perdido'];
const ALL_PRIORITIES: Priority[] = ['baja', 'media', 'alta', 'urgente'];

function exportToCSV(empresas: Empresa[]) {
  const headers = ['Empresa', 'Contacto', 'Email', 'Teléfono', 'Categoría', 'Servicio', 'Ubicación', 'Estado', 'Prioridad', 'Asignado', 'Fecha creación', 'Detalles'];
  const rows = empresas.map(e => [
    e.company_name,
    e.contact_name || '',
    e.email || '',
    e.phone || '',
    e.category_name || '',
    e.service_name || '',
    e.location || '',
    STATUS_LABELS[e.status] || e.status,
    PRIORITY_LABELS[(e.priority || 'media') as Priority] || e.priority || '',
    e.assigned_name || '',
    new Date(e.created_at).toLocaleDateString('es-MX'),
    (e.details || '').replace(/"/g, '""'),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `empresas_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Empresas() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterMember, setFilterM] = useState('');
  const [filterPriority, setFilterP] = useState('');
  const [filterService, setFilterS] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [showFilters, setShowF]   = useState(false);

  const params: Record<string, string> = {};
  if (search)         params.search      = search;
  if (filterStatus)   params.status      = filterStatus;
  if (filterCat)      params.category_id = filterCat;
  if (filterMember)   params.assigned_to = filterMember;
  if (filterPriority) params.priority    = filterPriority;
  if (filterService)  params.service_id  = filterService;
  if (dateFrom)       params.date_from   = dateFrom;
  if (dateTo)         params.date_to     = dateTo;

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

  const { data: servicios = [] } = useQuery<Service[]>({
    queryKey: ['servicios-activos'],
    queryFn: serviciosAPI.getActive,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => empresasAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setDeleteId(null);
    },
  });

  const activeFilters = [filterStatus, filterCat, filterMember, filterPriority, filterService, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{empresas.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => exportToCSV(empresas)}
            disabled={empresas.length === 0}
            title="Exportar a CSV"
          >
            <Download size={16} /> CSV
          </button>
          <Link to="/empresas/nueva" className="btn-primary">
            <Plus size={16} /> Nueva empresa
          </Link>
        </div>
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
          <div className="space-y-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="label">Prioridad</label>
                <select className="select" value={filterPriority} onChange={e => setFilterP(e.target.value)}>
                  <option value="">Todas</option>
                  {ALL_PRIORITIES.map(p => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Servicio</label>
                <select className="select" value={filterService} onChange={e => setFilterS(e.target.value)}>
                  <option value="">Todos</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Desde</label>
                <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">Hasta</label>
                <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => { setFilter(''); setFilterCat(''); setFilterM(''); setFilterP(''); setFilterS(''); setDateFrom(''); setDateTo(''); }}
              >
                Limpiar todos los filtros
              </button>
            )}
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
          <Building2 size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No hay empresas</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
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
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Servicio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Prioridad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Asignado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {empresas.map(emp => {
                  const prio = (emp.priority || 'media') as Priority;
                  const pColors = PRIORITY_COLORS[prio];
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{emp.company_name}</div>
                        {emp.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin size={11} /> {emp.location}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-gray-700 dark:text-gray-300">{emp.contact_name || '—'}</div>
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
                      <td className="px-4 py-3 hidden md:table-cell">
                        {emp.service_name ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: emp.service_color ?? '#6366F1' }}
                          >
                            <Briefcase size={10} /> {emp.service_name}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pColors.bg} ${pColors.text}`}>
                          {prio === 'urgente' && <AlertTriangle size={10} />}
                          {PRIORITY_LABELS[prio]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {emp.assigned_name ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={emp.assigned_name} color={emp.assigned_color} size="xs" />
                            <span className="text-gray-700 dark:text-gray-300 text-xs">{emp.assigned_name}</span>
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/empresas/${emp.id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            to={`/empresas/${emp.id}/editar`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => setDeleteId(emp.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">¿Eliminar empresa?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
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
