import Link from 'next/link';
import { ElectionStatusBadge } from './ElectionStatusBadge';
import type { Election } from '@/lib/electionStore';

export { type Election };

export function ElectionCard({ election }: { election: Election }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-3">
          <h3 className="text-lg font-bold text-white group-hover:text-brand transition-colors mb-1">
            {election.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2">
            {election.description || `Constituency: ${election.constituency}`}
          </p>
        </div>
        <ElectionStatusBadge status={election.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 my-3 border-y border-slate-800/80 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Constituency</p>
          <p className="font-bold text-white font-mono">{election.constituency}</p>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Votes</p>
          <p className="font-bold text-amber-400 font-mono">{(election.totalVotes || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Link href={`/results?electionId=${election.id}`}
          className="flex-1 text-center py-2.5 px-3 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-xl text-xs font-bold transition-all">
          Results
        </Link>
        <Link href={`/elections/${election.id}`}
          className="flex-1 text-center py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-bold transition-all">
          Manage
        </Link>
      </div>
    </div>
  );
}
