'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import * as store from '@/lib/electionStore';
import { BackButton } from '@/components/layout/BackButton';
import Link from 'next/link';

export default function LiveResultsPage() {
  const searchParams = useSearchParams();
  const electionIdFromQuery = searchParams.get('electionId');

  const [election, setElection] = useState<store.Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/mock/data');
      const data = await res.json();
      
      let elections: store.Election[] = [];
      if (data.success !== false && data.elections) {
        elections = data.elections;
      } else {
        elections = store.getAllElections(); // fallback
      }
      
      let selected: store.Election | null = null;
      if (electionIdFromQuery) {
        selected = elections.find((e) => e.id === electionIdFromQuery) || null;
      }
      if (!selected && elections.length > 0) {
        selected = elections[0];
      }

      setElection(selected);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      // Fallback to local
      const localElections = store.getAllElections();
      setElection(localElections.length > 0 ? localElections[0] : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [electionIdFromQuery]);

  const totalVotes = election ? election.candidates.reduce((s, c) => s + c.votes, 0) : 0;
  const sortedCandidates = election ? [...election.candidates].sort((a, b) => b.votes - a.votes) : [];
  const leader = sortedCandidates.length > 0 ? sortedCandidates[0] : null;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BackButton href="/elections" label="Back to Elections" />
        <div className="flex items-center gap-3">
          <button onClick={fetchResults}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
            <span className={`material-symbols-outlined text-sm text-brand ${loading ? 'animate-spin' : ''}`}>sync</span>
            Refresh
          </button>
          {lastRefreshed && <span className="text-[11px] font-mono text-slate-500">Updated: {lastRefreshed}</span>}
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-brand animate-spin">sync</span>
          <p className="text-sm font-semibold">Loading results...</p>
        </div>
      ) : !election ? (
        <div className="glass-card p-12 text-center text-slate-400 space-y-4">
          <span className="material-symbols-outlined text-5xl text-slate-600">how_to_vote</span>
          <h3 className="text-base font-bold text-white">No Elections Found</h3>
          <p className="text-xs text-slate-400 mt-1">Create an election first to view results.</p>
          <Link href="/elections/create" className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl">
            <span className="material-symbols-outlined text-sm">add_circle</span> Create Election
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Title */}
          <div className="border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold flex items-center gap-2 tracking-wider uppercase">
                <span className="relative w-2 h-2 rounded-full bg-emerald-400 pulse-dot" /> LIVE TALLY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{election.name}</h1>
            <p className="text-xs text-slate-400 mt-1">Constituency: <span className="font-mono text-brand font-bold">{election.constituency}</span></p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Votes</p>
              <p className="text-3xl font-extrabold text-white font-mono">{totalVotes.toLocaleString()}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Candidates</p>
              <p className="text-3xl font-extrabold text-brand font-mono">{election.candidates.length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
              <p className="text-3xl font-extrabold text-emerald-400 font-mono">{election.status}</p>
            </div>
          </div>

          {/* Leader Banner */}
          {leader && totalVotes > 0 && (
            <div className="glass-card p-6 sm:p-8 relative overflow-hidden border-brand/30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl -z-10 pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-brand flex items-center justify-center text-3xl shadow-xl shadow-brand/20 shrink-0">🏆</div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <span className="material-symbols-outlined text-sm">emoji_events</span>
                      {election.status === 'ENDED' ? 'Winner' : 'Leading'}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{leader.name}</h2>
                    <p className="text-xs text-slate-400 font-mono">Party: <span className="text-brand">{leader.party}</span></p>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 text-right min-w-[180px]">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Vote Share</p>
                  <p className="text-3xl font-extrabold text-brand font-mono">{totalVotes > 0 ? ((leader.votes / totalVotes) * 100).toFixed(1) : 0}%</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{leader.votes.toLocaleString()} votes</p>
                </div>
              </div>
            </div>
          )}

          {/* Vote Breakdown */}
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">bar_chart</span> Vote Breakdown
            </h3>
            {sortedCandidates.length === 0 ? (
              <p className="text-sm text-slate-400">No candidates registered yet.</p>
            ) : (
              <div className="space-y-5">
                {sortedCandidates.map((cand, idx) => {
                  const pct = totalVotes > 0 ? (cand.votes / totalVotes) * 100 : 0;
                  return (
                    <div key={cand.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cand.symbol}</span>
                          <span className="font-bold text-white">{cand.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">{cand.party}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-400 text-xs">{cand.votes.toLocaleString()} votes</span>
                          <span className="font-extrabold text-brand text-sm">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                        <div className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-gradient-to-r from-brand to-amber-500 shadow-md shadow-brand/30' : 'bg-slate-700'}`}
                          style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blockchain */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">verified</span> Blockchain Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contract Address</p>
                <p className="text-slate-300 break-all">{election.contractAddress}</p>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tx Hash</p>
                <p className="text-brand break-all">{election.txHash}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
