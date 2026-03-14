import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipoAPI, statsAPI } from '../api/client';
import { TeamMember, Stats } from '../types';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { Plus, Pencil, Trash2, Users, Trophy, TrendingUp } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#EC4899','#14B8A6','#F97316','#6366F1','#84CC16',
];

const ROLES = ['Asesor', 'Senior Asesor', 'Coordinador', 'Gerente', 'Director'];

function MemberForm({
  initial, onSave, onCancel, loading,
}: {
  initial?: Partial<TeamMember>;
  onSave: (data: { name: string; email: string; role: string; color: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role,  setRole]  = useState(initial?.role  ?? 'Asesor');
  const [color, setColor] = useState(initial?.color ?? '#3B82F6');

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Avatar name={name || 'N'} color={color} size="lg" />
      </div>
      <div>
        <label className="label">Nombre *</label>
        <input className="input" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" placeholder="correo@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label">Rol</label>
        <select className="select" value={role} onChange={e => setRole(e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Color de avatar</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1 justify-center" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary flex-1 justify-center"
          onClick={() => onSave({ name, email, role, color })}
          disabled={!name.trim() || loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export default function Equipo() {
  const qc = useQueryClient();
  const [addOpen,   setAddOpen]   = useState(false);
  const [editMember, setEditM]    = useState<TeamMember | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);

  const { data: equipo = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: statsAPI.get,
  });

  const createMutation = useMutation({
    mutationFn: equipoAPI.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipo'] }); setAddOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      equipoAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipo'] }); setEditM(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => equipoAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipo'] }); setDeleteId(null); },
  });

  const memberStatMap = Object.fromEntries(
    (stats?.memberStats ?? []).map(m => [m.id, m])
  );

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Equipo</h1>
          <p className="text-gray-500 text-sm mt-0.5">{equipo.length} integrantes</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Agregar miembro
        </button>
      </div>

      {equipo.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay miembros aún.</p>
          <button className="btn-primary mt-4" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Agregar miembro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipo.map(member => {
            const ms = memberStatMap[member.id];
            return (
              <div key={member.id} className="card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} color={member.color} size="lg" />
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                      {member.email && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditM(member)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(member.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                {ms && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-600">{ms.ganados}</p>
                      <p className="text-xs text-gray-400">Ganados</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{ms.negociando}</p>
                      <p className="text-xs text-gray-400">Neg.</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-600">{ms.total}</p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo miembro del equipo">
        <MemberForm
          onSave={data => createMutation.mutate(data)}
          onCancel={() => setAddOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editMember)} onClose={() => setEditM(null)} title="Editar miembro">
        {editMember && (
          <MemberForm
            initial={editMember}
            onSave={data => updateMutation.mutate({ id: editMember.id, ...data })}
            onCancel={() => setEditM(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <h3 className="text-lg font-semibold text-center">¿Eliminar miembro?</h3>
            <p className="text-gray-500 text-sm text-center mt-2">Sus empresas asignadas quedarán sin asignar.</p>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button
                className="btn-danger flex-1 justify-center"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
