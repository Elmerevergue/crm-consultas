import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { empresasAPI } from '../api/client';
import { Empresa, EmpresaStatus, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_ORDER } from '../types';
import type { Priority } from '../types';
import Avatar from '../components/Avatar';
import { useCurrentUser } from '../context/UserContext';
import { MapPin, GripVertical, Eye, AlertTriangle } from 'lucide-react';

export default function Kanban() {
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<EmpresaStatus | null>(null);

  const { data: empresas = [], isLoading } = useQuery<Empresa[]>({
    queryKey: ['empresas', {}],
    queryFn: () => empresasAPI.getAll(),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      empresasAPI.updateStatus(id, status, currentUser?.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const columns: Record<EmpresaStatus, Empresa[]> = {
    prospecto: [],
    contactado: [],
    negociando: [],
    ganado: [],
    perdido: [],
  };

  empresas.forEach(e => {
    if (columns[e.status]) columns[e.status].push(e);
  });

  const handleDragStart = (id: string) => {
    setDragging(id);
  };

  const handleDragOver = (e: React.DragEvent, status: EmpresaStatus) => {
    e.preventDefault();
    setDragOver(status);
  };

  const handleDrop = (status: EmpresaStatus) => {
    if (dragging) {
      const emp = empresas.find(e => e.id === dragging);
      if (emp && emp.status !== status) {
        moveMutation.mutate({ id: dragging, status });
      }
    }
    setDragging(null);
    setDragOver(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="page-title">Kanban</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Arrastra las empresas entre columnas para cambiar su estado
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {STATUS_ORDER.map(status => {
          const col = columns[status];
          const colors = STATUS_COLORS[status];
          const isOver = dragOver === status;

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-72 rounded-xl border-2 transition-colors ${
                isOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              }`}
              onDragOver={e => handleDragOver(e, status)}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(status)}
            >
              {/* Column header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    {col.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {col.map(emp => (
                  <div
                    key={emp.id}
                    draggable
                    onDragStart={() => handleDragStart(emp.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing
                      hover:shadow-md transition-shadow group ${dragging === emp.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {emp.company_name}
                        </p>
                        {emp.contact_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {emp.contact_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/empresas/${emp.id}`}
                          className="p-1 rounded text-gray-400 hover:text-blue-600"
                          onClick={e => e.stopPropagation()}
                        >
                          <Eye size={13} />
                        </Link>
                        <GripVertical size={13} className="text-gray-300" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {emp.priority && emp.priority !== 'media' && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[emp.priority as Priority]?.bg} ${PRIORITY_COLORS[emp.priority as Priority]?.text}`}>
                          {emp.priority === 'urgente' && <AlertTriangle size={10} />}
                          {PRIORITY_LABELS[emp.priority as Priority]}
                        </span>
                      )}
                      {emp.category_name && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: emp.category_color ?? '#6366F1' }}
                        >
                          {emp.category_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {emp.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={10} /> <span className="truncate max-w-[100px]">{emp.location}</span>
                        </div>
                      )}
                      {emp.assigned_name && (
                        <Avatar name={emp.assigned_name} color={emp.assigned_color} size="xs" />
                      )}
                    </div>
                  </div>
                ))}

                {col.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-500 text-xs">
                    Sin empresas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
