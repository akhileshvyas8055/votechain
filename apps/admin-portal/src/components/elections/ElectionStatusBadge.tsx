export function ElectionStatusBadge({ status }: { status: string }) {
  let badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700';

  if (status === 'ACTIVE') {
    badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (status === 'PAUSED') {
    badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (status === 'ENDED' || status === 'CERTIFIED') {
    badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  } else if (status === 'CREATED' || status === 'REGISTRATION') {
    badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
      {status === 'ACTIVE' && <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />}
      <span>{status}</span>
    </span>
  );
}
