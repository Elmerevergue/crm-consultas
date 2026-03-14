import { EmpresaStatus, STATUS_COLORS, STATUS_LABELS } from '../types';

interface Props {
  status: EmpresaStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { bg, text, dot } = STATUS_COLORS[status] ?? STATUS_COLORS.prospecto;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${bg} ${text} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
