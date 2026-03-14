interface Props {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZES = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };

export default function Avatar({ name, color = '#3B82F6', size = 'md' }: Props) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
