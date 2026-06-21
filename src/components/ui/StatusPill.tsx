import { clsx } from 'clsx';

interface StatusPillProps {
  active: boolean;
}

export function StatusPill({ active }: StatusPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      )}
    >
      {active ? 'مفعل' : 'معطل'}
    </span>
  );
}
