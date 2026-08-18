'use client';

import { useState } from 'react';
import { useElections } from '@/hooks/useElections';
import { ElectionCard } from '@/components/elections/ElectionCard';
import { BackButton } from '@/components/layout/BackButton';
import Link from 'next/link';

export default function ElectionsPage() {
  const { elections, loading, refresh } = useElections();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'ENDED'>('ALL');
  const [search, setSearch] = useState('');

  const filteredElections = elections.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.constituency.toLowerCase().includes(search.toLowerCase());

    if (filter === 'ALL') return matchesSearch;
    if (filter === 'ACTIVE') return matchesSearch && e.status === 'ACTIVE';
    if (filter === 'UPCOMING') return matchesSearch && (e.status === 'CREATED' || e.status === 'REGISTRATION');
    if (filter === 'ENDED') return matchesSearch && (e.status === 'ENDED' || e.status === 'PAUSED' || e.status === 'CERTIFIED');
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BackButton href="/" label="Back to Dashboard" />
        <Link href="/elections/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] self-start sm:self-auto">
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>New Election</span>
        </Link>
      </div>

      <div className="border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-brand text-3xl sm:text-4xl">ballot</span>
            Election Contracts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            {elections.length} election{elections.length !== 1 ? 's' : ''} deployed on Polygon EVM
          </p>
        </div>

        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          {(['ALL', 'ACTIVE', 'UPCOMING', 'ENDED'] as const).map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filter === tab ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or constituency..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
        </div>
        <button onClick={refresh}
          className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-base text-brand">refresh</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-brand animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading elections...</p>
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 mx-auto flex items-center justify-center border border-slate-800 text-slate-600">
            <span className="material-symbols-outlined text-3xl">inbox</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {search ? `No elections match "${search}"` : 'No Elections Found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {search ? 'Try a different search term.' : 'Deploy your first election contract to get started.'}
            </p>
          </div>
          {!search && (
            <Link href="/elections/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Create New Election
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElections.map((election) => (
            <ElectionCard key={election.id} election={election} />
          ))}
        </div>
      )}
    </div>
  );
}
