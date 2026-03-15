import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesAPI } from '../api/client';
import { MessageTemplate } from '../types';
import Modal from '../components/Modal';
import { useCurrentUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import {
  Plus, Pencil, Trash2, MessageSquare, Copy, Send,
} from 'lucide-react';

const CATEGORIES = ['Bienvenida', 'Seguimiento', 'Cotización', 'Cierre', 'General'];
const VARIABLES_HELP = '{{nombre_cliente}}, {{empresa}}, {{servicio}}, {{asesor}}';

export default function Plantillas() {
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editTpl, setEditTpl] = useState<MessageTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTpl, setPreviewTpl] = useState<MessageTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ['templates'],
    queryFn: templatesAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: templatesAPI.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); setShowAdd(false); toast('Plantilla creada', 'success'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) => templatesAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); setEditTpl(null); toast('Plantilla actualizada', 'success'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); setDeleteId(null); toast('Plantilla eliminada', 'success'); },
  });

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast('Copiado al portapapeles', 'success');
  };

  const openWhatsApp = (content: string) => {
    const encoded = encodeURIComponent(content);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: templates.filter(t => t.category === cat),
  })).filter(g => g.items.length > 0);

  const ungrouped = templates.filter(t => !CATEGORIES.includes(t.category));

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Plantillas de mensajes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{templates.length} plantillas</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Nueva plantilla
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-16 text-center">
          <MessageSquare size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay plantillas aún.</p>
          <button className="btn-primary mt-4" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Crear plantilla
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(g => (
            <div key={g.category}>
              <h2 className="section-title mb-3">{g.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map(tpl => (
                  <TemplateCard
                    key={tpl.id}
                    tpl={tpl}
                    onEdit={() => setEditTpl(tpl)}
                    onDelete={() => setDeleteId(tpl.id)}
                    onCopy={() => copyToClipboard(tpl.content)}
                    onWhatsApp={() => openWhatsApp(tpl.content)}
                    onPreview={() => setPreviewTpl(tpl)}
                  />
                ))}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div>
              <h2 className="section-title mb-3">Otras</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ungrouped.map(tpl => (
                  <TemplateCard
                    key={tpl.id}
                    tpl={tpl}
                    onEdit={() => setEditTpl(tpl)}
                    onDelete={() => setDeleteId(tpl.id)}
                    onCopy={() => copyToClipboard(tpl.content)}
                    onWhatsApp={() => openWhatsApp(tpl.content)}
                    onPreview={() => setPreviewTpl(tpl)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva plantilla">
        <TemplateForm
          onSave={data => createMutation.mutate({ ...data, created_by: currentUser?.id ?? null })}
          onCancel={() => setShowAdd(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editTpl)} onClose={() => setEditTpl(null)} title="Editar plantilla">
        {editTpl && (
          <TemplateForm
            initial={editTpl}
            onSave={data => updateMutation.mutate({ id: editTpl.id, ...data })}
            onCancel={() => setEditTpl(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Preview modal */}
      <Modal open={Boolean(previewTpl)} onClose={() => setPreviewTpl(null)} title="Vista previa">
        {previewTpl && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Ejemplo con datos ficticios:</p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {templatesAPI.fillTemplate(previewTpl.content, {
                nombre_cliente: 'Juan Pérez',
                empresa: 'Tech Solutions',
                servicio: 'Diseño Web',
                asesor: currentUser?.name ?? 'Carlos',
              })}
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => { copyToClipboard(previewTpl.content); }}>
                <Copy size={14} /> Copiar
              </button>
              <button className="btn-primary" onClick={() => openWhatsApp(previewTpl.content)}>
                <Send size={14} /> Enviar por WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">¿Eliminar plantilla?</h3>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn-danger flex-1 justify-center" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ tpl, onEdit, onDelete, onCopy, onWhatsApp, onPreview }: {
  tpl: MessageTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onWhatsApp: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{tpl.name}</p>
          <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full mt-1">
            {tpl.category}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 whitespace-pre-wrap">{tpl.content}</p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button onClick={onPreview} className="text-xs text-blue-600 hover:underline">Vista previa</button>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onCopy} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Copiar">
            <Copy size={14} />
          </button>
          <button onClick={onWhatsApp} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30" title="WhatsApp">
            <Send size={14} />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Editar">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateForm({ initial, onSave, onCancel, loading }: {
  initial?: Partial<MessageTemplate>;
  onSave: (data: { name: string; category: string; content: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'General');
  const [content, setContent] = useState(initial?.content ?? '');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nombre *</label>
        <input className="input" placeholder="Ej. Mensaje de bienvenida" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="label">Categoría</label>
        <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Contenido del mensaje *</label>
        <textarea
          className="textarea"
          rows={5}
          placeholder={'Hola {{nombre_cliente}}, soy {{asesor}} de...\n\nVariables disponibles: ' + VARIABLES_HELP}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1">Variables: {VARIABLES_HELP}</p>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn-primary" onClick={() => onSave({ name, category, content })} disabled={!name.trim() || !content.trim() || loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
