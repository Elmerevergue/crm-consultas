import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviciosAPI } from '../api/client';
import { Service } from '../types';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Briefcase, ToggleLeft, ToggleRight } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#EC4899','#14B8A6','#F97316','#6366F1','#84CC16',
];

function ServiceForm({
  initial, onSave, onCancel, loading,
}: {
  initial?: Partial<Service>;
  onSave: (data: { name: string; description: string; color: string; price: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? '#3B82F6');
  const [price, setPrice] = useState(initial?.price ?? '');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nombre del servicio *</label>
        <input
          className="input"
          placeholder="Ej. Diseño Web"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea
          className="textarea"
          rows={2}
          placeholder="Breve descripción del servicio..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Precio / Rango (opcional)</label>
        <input
          className="input"
          placeholder="Ej. $5,000 - $15,000 o Desde $2,000"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">{color}</span>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1 justify-center" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary flex-1 justify-center"
          onClick={() => onSave({ name, description, color, price })}
          disabled={!name.trim() || loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export default function Servicios() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editSvc, setEditSvc] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['servicios'],
    queryFn: serviciosAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: serviciosAPI.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['servicios'] }); setAddOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      serviciosAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['servicios'] }); setEditSvc(null); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      serviciosAPI.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviciosAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['servicios'] }); setDeleteId(null); },
  });

  const activeServices = services.filter(s => s.active);
  const inactiveServices = services.filter(s => !s.active);

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Servicios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {activeServices.length} activos · {inactiveServices.length} inactivos
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="card p-16 text-center">
          <Briefcase size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay servicios aún.</p>
          <button className="btn-primary mt-4" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Agregar servicio
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active services */}
          <div>
            <h2 className="section-title mb-3">Servicios activos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeServices.map(svc => (
                <div key={svc.id} className="card p-4 group">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: svc.color }}
                    >
                      <Briefcase size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{svc.name}</p>
                      {svc.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{svc.description}</p>
                      )}
                      {svc.price && (
                        <p className="text-xs font-medium text-green-600 mt-1">{svc.price}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: svc.id, active: false })}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-600 transition-colors"
                      title="Desactivar"
                    >
                      <ToggleRight size={16} className="text-green-500" /> Activo
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditSvc(svc)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(svc.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {activeServices.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">No hay servicios activos.</p>
              )}
            </div>
          </div>

          {/* Inactive */}
          {inactiveServices.length > 0 && (
            <div>
              <h2 className="section-title mb-3 text-gray-400">Inactivos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inactiveServices.map(svc => (
                  <div key={svc.id} className="card p-4 opacity-60 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Briefcase size={18} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-500 dark:text-gray-400">{svc.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: svc.id, active: true })}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <ToggleLeft size={16} /> Activar
                        </button>
                        <button onClick={() => setDeleteId(svc.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo servicio">
        <ServiceForm
          onSave={data => createMutation.mutate(data)}
          onCancel={() => setAddOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editSvc)} onClose={() => setEditSvc(null)} title="Editar servicio">
        {editSvc && (
          <ServiceForm
            initial={editSvc}
            onSave={data => updateMutation.mutate({ id: editSvc.id, ...data })}
            onCancel={() => setEditSvc(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">¿Eliminar servicio?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
              Las empresas con este servicio quedarán sin asignar.
            </p>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button
                className="btn-danger flex-1 justify-center"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
