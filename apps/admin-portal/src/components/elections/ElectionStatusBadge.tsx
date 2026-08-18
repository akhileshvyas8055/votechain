import { clsx } from 'clsx';

interface BadgeProps {
  status: 'CREATED' | 'REGISTRATION' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CERTIFIED';
}

const statusStyles = {
  CREATED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  REGISTRATION: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse',
  PAUSED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ENDED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  CERTIFIED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

export function ElectionStatusBadge({ status }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status] || statusStyles.CREATED
      )}
    >
      {status}
    </span>
  );
}
