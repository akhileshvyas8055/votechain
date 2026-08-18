import Link from 'next/link';
import { ElectionStatusBadge } from './ElectionStatusBadge';
import { Election } from '@/hooks/useElections';
import { Calendar, MapPin, Vote } from 'lucide-react';

export function ElectionCard({ election }: { election: Election }) {
  return (
    <div className="glass-panel rounded-2xl p-6 hover:border-brand-500/40 transition glow-blue group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-brand-400 transition">
            {election.name}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Constituency: {election.constituency}</span>
          </div>
        </div>
        <ElectionStatusBadge status={election.status} />
      </div>

      <div className="space-y-2 py-3 border-y border-dark-border/60 text-xs text-slate-300">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Start Time:
          </span>
          <span>{new Date(election.startTime).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Vote className="w-3.5 h-3.5" /> Total Votes Cast:
          </span>
          <span className="font-semibold text-brand-400">{election.totalVotes.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 flex space-x-3">
        <Link
          href={`/results?electionId=${election.id}`}
          className="flex-1 text-center py-2 px-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-xl text-xs font-semibold transition"
        >
          Live Analytics
        </Link>
        <Link
          href={`/elections/${election.id}`}
          className="flex-1 text-center py-2 px-3 bg-dark-card hover:bg-dark-border text-slate-300 rounded-xl text-xs font-medium transition"
        >
          Manage State
        </Link>
      </div>
    </div>
  );
}
