'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as store from '@/lib/electionStore';
import { useElections } from '@/hooks/useElections';

function MetricCard({ title, value, icon, accent, badge }: {
  title: string; value: string | number; icon: string; accent: string; badge?: string;
}) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${accent}`} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {badge && (
          <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
        <span className="material-symbols-outlined text-3xl text-slate-600 group-hover:text-brand transition-colors">{icon}</span>
      </div>
    </div>
  );
}

function DashboardElectionCard({ election }: { election: store.Election }) {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CREATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PAUSED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ENDED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-bold text-white mb-1">{election.name}</h3>
          <p className="text-xs text-slate-400 line-clamp-2">{election.description || `Constituency: ${election.constituency}`}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider ${statusColors[election.status] || statusColors.CREATED}`}>
          {election.status === 'ACTIVE' && <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />}
          {election.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Constituency</p>
          <p className="text-xs font-bold text-white font-mono">{election.constituency}</p>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Votes Logged</p>
          <p className="text-xs font-bold text-amber-400 font-mono">{election.totalVotes.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href={`/results?electionId=${election.id}`} className="flex-1 text-center py-2.5 text-xs font-bold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-xl transition-all">
          Live Analytics
        </Link>
        <Link href={`/elections/${election.id}`} className="flex-1 text-center py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 rounded-xl transition-all">
          Manage
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [time, setTime] = useState('');
  const { elections, loading, refresh } = useElections();
  const [stats, setStats] = useState({
    totalElections: 0,
    activePolls: 0,
    upcomingElections: 0,
    completedElections: 0,
    totalVoters: 0,
    totalVotes: 0,
  });
  const [auditEntries, setAuditEntries] = useState<store.AuditEntry[]>([]);

  useEffect(() => {
    setIsMounted(true);
    
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setStats(store.getDashboardStats());
      setAuditEntries(store.getAllAuditEntries().slice(0, 8));
    }
  }, [elections, isMounted]);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-brand text-3xl sm:text-4xl">space_dashboard</span>
            Commission Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Polygon EVM Consensus • System Active {isMounted && time ? `• ${time}` : ''}
          </p>
        </div>

        <Link
          href="/elections/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Deploy New Election</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard title="Total Elections" value={isMounted ? stats.totalElections : '—'} icon="ballot" accent="bg-brand" />
        <MetricCard title="Active Polls" value={isMounted ? stats.activePolls : '—'} icon="how_to_vote" accent="bg-emerald-500" badge={isMounted && stats.activePolls > 0 ? "LIVE" : undefined} />
        <MetricCard title="Total Voters" value={isMounted ? stats.totalVoters : '—'} icon="groups" accent="bg-violet-500" />
        <MetricCard title="Votes Cast" value={isMounted ? stats.totalVotes.toLocaleString() : '—'} icon="receipt_long" accent="bg-blue-500" />
      </div>

      {/* Election Deployments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-brand">how_to_vote</span>
            Election Deployments
          </h2>
          <Link href="/elections" className="text-xs text-brand hover:text-amber-400 font-bold flex items-center gap-1 transition">
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-brand animate-spin">sync</span>
            <p className="text-sm font-semibold">Loading election contracts...</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="glass-card p-10 text-center text-slate-400 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 mx-auto flex items-center justify-center border border-slate-800 text-brand">
              <span className="material-symbols-outlined text-3xl">ballot</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Elections Deployed Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Create your first election to initialize a smart contract on the Polygon EVM network.
              </p>
            </div>
            <Link
              href="/elections/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand to-amber-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-brand/20 transition"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Create First Election
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {elections.slice(0, 4).map((election) => (
              <DashboardElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Audit Trail */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">verified_user</span>
            Recent Audit Trail
          </h2>
          <Link href="/audit" className="text-xs text-brand hover:text-amber-400 font-bold flex items-center gap-1 transition">
            Full Audit Logs <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="glass-card overflow-hidden">
          {auditEntries.length === 0 ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-600">security</span>
              <p className="text-sm font-semibold text-slate-300">No Audit Entries Yet</p>
              <p className="text-xs text-slate-500">Create an election or register a voter to see blockchain audit trail entries here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/40">
                    <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Tx Hash</th>
                    <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Action</th>
                    <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Entity</th>
                    <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">By</th>
                    <th className="text-right text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {auditEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-brand text-xs">{entry.txHash.slice(0, 10)}...{entry.txHash.slice(-4)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{entry.entityType}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{entry.performedBy}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs font-semibold text-emerald-400">{entry.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
