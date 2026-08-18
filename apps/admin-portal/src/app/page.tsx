'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ─── Sidebar Nav Items ─── */
const navItems = [
  { label: 'Dashboard', labelHi: 'डैशबोर्ड', href: '/', icon: 'dashboard' },
  { label: 'Live Results', labelHi: 'लाइव परिणाम', href: '/results', icon: 'how_to_vote' },
  { label: 'Voter Enrollment', labelHi: 'मतदाता पंजीकरण', href: '/voters/register', icon: 'fingerprint' },
  { label: 'Elections', labelHi: 'चुनाव प्रबंधन', href: '/elections', icon: 'ballot' },
  { label: 'Audit Trail', labelHi: 'ऑडिट लॉग', href: '/audit', icon: 'shield' },
];

/* ─── Metric Card ─── */
function MetricCard({ title, value, icon, accent, badge }: {
  title: string; value: string; icon: string; accent: string; badge?: string;
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
function ElectionCard({ title, desc, participation, timeLeft, status }: {
  title: string; desc: string; participation: string; timeLeft: string; status: string;
}) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{desc}</p>
        </div>
        <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          {status}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Participation</p>
          <p className="text-base font-bold text-white font-mono">{participation}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Time Left</p>
          <p className="text-base font-bold text-amber-400 font-mono">{timeLeft}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/results" className="flex-1 text-center py-2.5 text-sm font-semibold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-xl transition-all">
          Live Analytics
        </Link>
        <Link href="/elections" className="flex-1 text-center py-2.5 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 rounded-xl transition-all">
          Manage
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Page ─── */
export default function DashboardPage() {
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
              <p className="text-xs font-semibold text-slate-200">Polygon Mainnet</p>
              <p className="text-[10px] text-emerald-400 font-mono">Block #14,892,044</p>
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
              <p className="text-xs text-slate-500 font-mono">System Optimal • {time}</p>
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
            <MetricCard title="Total Elections" value="12" icon="ballot" accent="bg-brand" />
            <MetricCard title="Active Polls" value="4" icon="how_to_vote" accent="bg-emerald-500" badge="LIVE" />
            <MetricCard title="Votes Logged" value="14,82,900" icon="receipt_long" accent="bg-violet-500" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ElectionCard
                title="General Parliamentary Election 2026"
                desc="National constituency representation election for central parliament."
                participation="64.2%"
                timeLeft="04h 12m"
                status="LIVE"
              />
              <ElectionCard
                title="Municipal Infrastructure Bond"
                desc="50M USDC allocation for metropolitan transit grid restructuring."
                participation="82.1%"
                timeLeft="2d 04h"
                status="LIVE"
              />
            </div>
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
                    {[
                      { tx: '892044-12', action: 'VOTE_CAST', wallet: '0x8626...0A59', booth: 'B-Del-04', status: 'Verified', statusColor: 'text-emerald-400' },
                      { tx: '892044-11', action: 'VOTE_CAST', wallet: '0x44ab...992c', booth: 'B-Mum-12', status: 'Verified', statusColor: 'text-emerald-400' },
                      { tx: '892044-10', action: 'ID_VERIFY', wallet: '0x9f1e...bc44', booth: 'Online', status: 'Verified', statusColor: 'text-emerald-400' },
                      { tx: '892044-09', action: 'VOTE_CAST', wallet: '0x22ca...110a', booth: 'B-Kol-01', status: 'Pending', statusColor: 'text-amber-400' },
                      { tx: '892044-08', action: 'REJECTED', wallet: '0x1a2b...3c4d', booth: 'B-Blr-09', status: 'Failed', statusColor: 'text-red-400' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-brand text-xs">{row.tx}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                            row.action === 'VOTE_CAST' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            row.action === 'ID_VERIFY' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {row.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{row.wallet}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{row.booth}</td>
                        <td className={`px-5 py-3.5 text-right text-xs font-semibold ${row.statusColor}`}>
                          {row.status === 'Verified' && <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>}
                          {row.status === 'Pending' && <span className="material-symbols-outlined text-sm align-middle mr-1 animate-spin">hourglass_empty</span>}
                          {row.status === 'Failed' && <span className="material-symbols-outlined text-sm align-middle mr-1">cancel</span>}
                          {row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
