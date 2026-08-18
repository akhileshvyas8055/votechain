'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

interface Election {
  id: string;
  name: string;
  constituency: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  totalVotes?: number;
}

interface AuditLog {
  tx: string;
  action: string;
  wallet: string;
  booth: string;
  status: string;
  statusColor: string;
}

/* ─── Metric Card ─── */
function MetricCard({ title, value, icon, accent, badge }: {
  title: string; value: string | number; icon: string; accent: string; badge?: string;
}) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${accent}`} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        {badge && (
          <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <span className="material-symbols-outlined text-3xl text-slate-600 group-hover:text-brand transition-colors">{icon}</span>
      </div>
    </div>
  );
}

/* ─── Election Card ─── */
function ElectionCard({ election }: { election: Election }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-white mb-1">{election.name}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{election.description || `Constituency: ${election.constituency}`}</p>
        </div>
        <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-500/20 whitespace-nowrap uppercase">
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          {election.status}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Constituency</p>
          <p className="text-sm font-bold text-white font-mono">{election.constituency}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Votes Logged</p>
          <p className="text-sm font-bold text-amber-400 font-mono">{(election.totalVotes || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/results?electionId=${election.id}`} className="flex-1 text-center py-2.5 text-sm font-semibold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-xl transition-all">
          Live Analytics
        </Link>
        <Link href="/elections" className="flex-1 text-center py-2.5 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 rounded-xl transition-all">
          Manage
        </Link>
      </div>
    </div>
  );
}

/* ─── Sidebar Nav Items ─── */
const navItems = [
  { label: 'Dashboard', labelHi: 'डैशबोर्ड', href: '/', icon: 'dashboard' },
  { label: 'Live Results', labelHi: 'लाइव परिणाम', href: '/results', icon: 'how_to_vote' },
  { label: 'Voter Enrollment', labelHi: 'मतदाता पंजीकरण', href: '/voters/register', icon: 'fingerprint' },
  { label: 'Elections', labelHi: 'चुनाव प्रबंधन', href: '/elections', icon: 'ballot' },
  { label: 'Audit Trail', labelHi: 'ऑडिट लॉग', href: '/audit', icon: 'shield' },
];

/* ─── Main Dashboard Page ─── */
export default function DashboardPage() {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [elections, setElections] = useState<Election[]>([]);
  const [auditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.get('/elections/active');
        setElections(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setElections([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalElections = elections.length;
  const activePolls = elections.filter(e => e.status === 'ACTIVE').length;
  const totalVotes = elections.reduce((acc, e) => acc + (e.totalVotes || 0), 0);

  return (
    <div className="flex min-h-screen">
      
      {/* ═══ SIDEBAR ═══ */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/80 backdrop-blur-2xl border-r border-slate-800/50 fixed inset-y-0 left-0 z-40">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-amber-600 flex items-center justify-center shadow-lg shadow-brand/20">
              <span className="text-xl">🇮🇳</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">VoteChain EVM</h1>
              <p className="text-[11px] text-brand font-medium">Election Commission</p>
            </div>
          </div>
          
          {/* Node Status */}
          <div className="mt-4 flex items-center gap-2.5 bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
            <span className="relative w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Polygon Network</p>
              <p className="text-[10px] text-emerald-400 font-mono">Node Active</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="p-4 border-t border-slate-800/50">
          <Link
            href="/elections/create"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-brand to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Deploy Election
          </Link>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 lg:ml-72">
        
        {/* ─── TOP BAR ─── */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="flex items-center justify-between px-8 h-16">
            <div>
              <h2 className="text-lg font-bold text-white">Commission Dashboard</h2>
              <p className="text-xs text-slate-500 font-mono">System Active • {time}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-700/30">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>
              <button className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-700/30">
                <span className="material-symbols-outlined text-xl">settings</span>
              </button>
              <div className="flex items-center gap-3 bg-slate-800/50 pl-4 pr-2 py-1.5 rounded-xl border border-slate-700/30">
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">EC Admin Officer</p>
                  <p className="text-[10px] text-emerald-400 font-mono">SUPER_ADMIN</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                  EC
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ─── PAGE CONTENT ─── */}
        <main className="p-8 space-y-8">
          
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <MetricCard title="Total Elections" value={totalElections} icon="ballot" accent="bg-brand" />
            <MetricCard title="Active Polls" value={activePolls} icon="how_to_vote" accent="bg-emerald-500" badge={activePolls > 0 ? "LIVE" : undefined} />
            <MetricCard title="Votes Logged" value={totalVotes.toLocaleString()} icon="receipt_long" accent="bg-violet-500" />
            <MetricCard title="Chain Security" value="100%" icon="verified_user" accent="bg-blue-500" badge="VERIFIED" />
          </div>

          {/* Active Deployments */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Active Deployments</h3>
              <Link href="/elections" className="text-sm text-brand hover:text-amber-400 font-medium flex items-center gap-1 transition">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {loading ? (
              <div className="glass-card p-8 text-center text-slate-400">Loading elections...</div>
            ) : elections.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-400 space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-600">ballot</span>
                <p className="text-base font-semibold text-slate-300">No Active Elections Deployed</p>
                <p className="text-xs text-slate-500">Create a new election using the 'Deploy Election' button to start polling.</p>
                <Link
                  href="/elections/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Create First Election
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {elections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            )}
          </section>

          {/* Quick Audit Log */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">verified_user</span>
                Recent Audit Trail
              </h3>
            </div>

            <div className="glass-card overflow-hidden">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <span className="material-symbols-outlined text-3xl text-slate-600">security</span>
                  <p className="text-sm">No transaction audit logs recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800/50">
                        <th className="text-left text-[11px] text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Tx Index</th>
                        <th className="text-left text-[11px] text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Action</th>
                        <th className="text-left text-[11px] text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Wallet</th>
                        <th className="text-left text-[11px] text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Booth</th>
                        <th className="text-right text-[11px] text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {auditLogs.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-brand text-xs">{row.tx}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {row.action}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{row.wallet}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">{row.booth}</td>
                          <td className={`px-5 py-3.5 text-right text-xs font-semibold ${row.statusColor}`}>
                            {row.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

