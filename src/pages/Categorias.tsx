import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriasAPI } from '../api/client';
import { Category } from '../types';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#EC4899','#14B8A6','#F97316','#6366F1','#84CC16',
];

function CategoryForm({
  initial, onSave, onCancel, loading,
}: {
  initial?: Partial<Category>;
  onSave: (data: { name: string; color: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? '#3B82F6');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input
          className="input"
          placeholder="Ej. Tecnología"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
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
            className="w-10 h-10 rounded cursor-pointer border border-gray-200"
          />
          <span className="text-sm text-gray-500">{color}</span>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1 justify-center" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary flex-1 justify-center"
          onClick={() => onSave({ name, color })}
          disabled={!name.trim() || loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export default function Categorias() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen]   = useState(false);
  const [editCat, setEditCat]   = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categorias = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categorias'],
    queryFn: categoriasAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: categoriasAPI.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); setAddOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; color: string }) =>
      categoriasAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); setEditCat(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriasAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); setDeleteId(null); },
  });

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tipos de servicio o industria</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categorias.length === 0 ? (
        <div className="card p-16 text-center">
          <Tag size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay categorías aún.</p>
          <button className="btn-primary mt-4" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Agregar categoría
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorias.map(cat => (
            <div key={cat.id} className="card p-4 flex items-center gap-3 group">
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.color}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditCat(cat)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nueva categoría">
        <CategoryForm
          onSave={data => createMutation.mutate(data)}
          onCancel={() => setAddOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editCat)} onClose={() => setEditCat(null)} title="Editar categoría">
        {editCat && (
          <CategoryForm
            initial={editCat}
            onSave={data => updateMutation.mutate({ id: editCat.id, ...data })}
            onCancel={() => setEditCat(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <h3 className="text-lg font-semibold text-center">¿Eliminar categoría?</h3>
            <p className="text-gray-500 text-sm text-center mt-2">
              Las empresas con esta categoría quedarán sin asignar.
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
