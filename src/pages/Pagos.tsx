import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagosAPI, empresasAPI } from '../api/client';
import {
  Payment, Empresa, PaymentType, PaymentStatus,
  PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  formatGTQ,
} from '../types';
import Modal from '../components/Modal';
import { useCurrentUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import {
  Plus, DollarSign, Trash2, Pencil, Building2,
  TrendingUp, TrendingDown, Filter,
} from 'lucide-react';

const TYPES: PaymentType[] = ['cotizacion', 'pago'];
const STATUSES: PaymentStatus[] = ['pendiente', 'pagado', 'cancelado'];

export default function Pagos() {
  const qc = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filters: Record<string, string> = {};
  if (filterType) filters.type = filterType;
  if (filterStatus) filters.status = filterStatus;

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['payments', filters],
    queryFn: () => pagosAPI.getAll(filters),
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ['empresas', {}],
    queryFn: () => empresasAPI.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: pagosAPI.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setShowAdd(false); toast('Registro creado', 'success'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) => pagosAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setEditPayment(null); toast('Registro actualizado', 'success'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagosAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); toast('Registro eliminado', 'success'); },
  });

  // Summary
  const totalCotizaciones = payments.filter(p => p.type === 'cotizacion').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPagos = payments.filter(p => p.type === 'pago' && p.status === 'pagado').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPendiente = payments.filter(p => p.status === 'pendiente').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Pagos y Cotizaciones</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{payments.length} registros</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Nuevo registro
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total cotizado</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatGTQ(totalCotizaciones)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total cobrado</p>
              <p className="text-xl font-bold text-green-600">{formatGTQ(totalPagos)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingDown size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pendiente de cobro</p>
              <p className="text-xl font-bold text-amber-600">{formatGTQ(totalPendiente)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          <select className="select max-w-[180px]" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos los tipos</option>
            {TYPES.map(t => <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>)}
          </select>
          <select className="select max-w-[180px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.map(s => <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="card p-16 text-center">
          <DollarSign size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay registros de pagos/cotizaciones.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map(p => {
                  const sc = PAYMENT_STATUS_COLORS[p.status as PaymentStatus] ?? PAYMENT_STATUS_COLORS.pendiente;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(p.date).toLocaleDateString('es-GT')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <Building2 size={13} className="text-gray-400" />
                          {p.empresa_name || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.concept}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'pago' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {PAYMENT_TYPE_LABELS[p.type as PaymentType] ?? p.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatGTQ(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          {PAYMENT_STATUS_LABELS[p.status as PaymentStatus] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditPayment(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                            <Trash2 size={14} />
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

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo registro">
        <PaymentForm
          empresas={empresas}
          onSave={data => createMutation.mutate({ ...data, created_by: currentUser?.id ?? null })}
          onCancel={() => setShowAdd(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editPayment)} onClose={() => setEditPayment(null)} title="Editar registro">
        {editPayment && (
          <PaymentForm
            initial={editPayment}
            empresas={empresas}
            onSave={data => updateMutation.mutate({ id: editPayment.id, ...data })}
            onCancel={() => setEditPayment(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

function PaymentForm({ initial, empresas, onSave, onCancel, loading }: {
  initial?: Partial<Payment>;
  empresas: Empresa[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [empresa_id, setEmpresaId] = useState(initial?.empresa_id ?? '');
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [concept, setConcept] = useState(initial?.concept ?? '');
  const [type, setType] = useState<PaymentType>(initial?.type as PaymentType ?? 'cotizacion');
  const [status, setStatus] = useState<PaymentStatus>(initial?.status as PaymentStatus ?? 'pendiente');
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Empresa *</label>
        <select className="select" value={empresa_id} onChange={e => setEmpresaId(e.target.value)}>
          <option value="">Seleccionar empresa</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.company_name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Monto (GTQ) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Q</span>
            <input className="input pl-7" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Fecha *</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Concepto *</label>
        <input className="input" placeholder="Ej. Cotización diseño web" value={concept} onChange={e => setConcept(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select className="select" value={type} onChange={e => setType(e.target.value as PaymentType)}>
            {TYPES.map(t => <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="select" value={status} onChange={e => setStatus(e.target.value as PaymentStatus)}>
            {STATUSES.map(s => <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notas</label>
        <textarea className="textarea" rows={2} placeholder="Observaciones..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn-primary" onClick={() => onSave({ empresa_id: empresa_id || null, amount: parseFloat(amount) || 0, concept, type, status, date, notes })} disabled={!concept.trim() || !amount || loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
