'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import * as store from '@/lib/electionStore';
import toast from 'react-hot-toast';
import { BackButton } from '@/components/layout/BackButton';
import { ElectionStatusBadge } from '@/components/elections/ElectionStatusBadge';
import Link from 'next/link';

export default function ElectionDetailPage() {
  const params = useParams();
  const electionId = params.id as string;

  const [election, setElection] = useState<store.Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCand, setNewCand] = useState({ name: '', party: '', symbol: '🗳️' });

  const fetchElection = () => {
    setLoading(true);
    const found = store.getElectionById(electionId);
    setElection(found || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchElection();
  }, [electionId]);

  const handleUpdateStatus = async (newStatus: 'ACTIVE' | 'PAUSED' | 'ENDED') => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const updated = store.updateElectionStatus(electionId, newStatus);
    if (updated) {
      setElection(updated);
      toast.success(`Election status updated to ${newStatus}`);
    } else {
      toast.error('Failed to update status');
    }
    setActionLoading(false);
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCand.name.trim() || !newCand.party.trim()) {
      toast.error('Name and party are required');
      return;
    }
    const added = store.addCandidateToElection(electionId, newCand);
    if (added) {
      toast.success(`Candidate ${added.name} added`);
      setShowAddCandidate(false);
      setNewCand({ name: '', party: '', symbol: '🗳️' });
      fetchElection();
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-4xl text-brand animate-spin">sync</span>
        <p className="text-sm font-semibold">Loading election details...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="space-y-6">
        <BackButton href="/elections" label="Back to Elections" />
        <div className="glass-card p-12 text-center text-slate-400 space-y-4">
          <span className="material-symbols-outlined text-5xl text-slate-600">search_off</span>
          <h2 className="text-xl font-bold text-white">Election Not Found</h2>
          <p className="text-xs text-slate-400">Election ID <code className="text-brand">{electionId}</code> does not exist.</p>
          <Link href="/elections" className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Elections
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = election.candidates.reduce((s, c) => s + c.votes, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BackButton href="/elections" label="Back to Elections" />
        <div className="flex items-center gap-3">
          <Link href={`/results?electionId=${election.id}`}
            className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-xl text-xs font-bold transition flex items-center gap-2">
            <span className="material-symbols-outlined text-base">bar_chart</span> Live Results
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ElectionStatusBadge status={election.status} />
              <span className="text-xs font-mono text-slate-400">ID: {election.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{election.name}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Constituency: <span className="font-mono text-brand font-bold">{election.constituency}</span>
              {election.description && <span> — {election.description}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(election.status === 'CREATED' || election.status === 'REGISTRATION') && (
              <button disabled={actionLoading} onClick={() => handleUpdateStatus('ACTIVE')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50">
                <span className="material-symbols-outlined text-base">play_arrow</span> Start Polling
              </button>
            )}
            {election.status === 'ACTIVE' && (
              <button disabled={actionLoading} onClick={() => handleUpdateStatus('PAUSED')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50">
                <span className="material-symbols-outlined text-base">pause</span> Pause
              </button>
            )}
            {election.status !== 'ENDED' && election.status !== 'CERTIFIED' && (
              <button disabled={actionLoading} onClick={() => handleUpdateStatus('ENDED')}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50">
                <span className="material-symbols-outlined text-base">stop</span> End Election
              </button>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Start</p>
            <p className="text-slate-200 font-mono">{new Date(election.startTime).toLocaleString()}</p>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">End</p>
            <p className="text-slate-200 font-mono">{new Date(election.endTime).toLocaleString()}</p>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Votes</p>
            <p className="text-brand font-bold font-mono">{totalVotes.toLocaleString()}</p>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Contract</p>
            <p className="text-brand truncate font-mono">{election.contractAddress.slice(0, 10)}...{election.contractAddress.slice(-4)}</p>
          </div>
        </div>
      </div>

      {/* Candidates */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">groups</span>
              Candidates ({election.candidates.length})
            </h2>
          </div>
          {election.status === 'CREATED' && (
            <button onClick={() => setShowAddCandidate(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-brand font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">add</span> Add
            </button>
          )}
        </div>

        {showAddCandidate && (
          <form onSubmit={handleAddCandidate} className="bg-slate-950 p-5 rounded-2xl border border-brand/40 space-y-4">
            <h3 className="text-sm font-bold text-white">Register New Candidate</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input type="text" required placeholder="Full Name" value={newCand.name}
                onChange={(e) => setNewCand({ ...newCand, name: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand focus:outline-none" />
              <input type="text" required placeholder="Party" value={newCand.party}
                onChange={(e) => setNewCand({ ...newCand, party: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand focus:outline-none" />
              <input type="text" placeholder="Symbol emoji" value={newCand.symbol}
                onChange={(e) => setNewCand({ ...newCand, symbol: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand focus:outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddCandidate(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition">Save</button>
            </div>
          </form>
        )}

        {election.candidates.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">person_off</span>
            <p className="text-sm font-semibold text-slate-300">No Candidates Registered</p>
            <p className="text-xs text-slate-500 mt-1">Add candidates before starting the election.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {election.candidates.map((cand) => (
              <div key={cand.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                  {cand.symbol}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{cand.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">Party: <span className="text-brand">{cand.party}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white font-mono">{cand.votes.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Votes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blockchain Info */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400">verified</span>
          Blockchain Verification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contract Address</p>
            <p className="text-slate-300 break-all">{election.contractAddress}</p>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Deployment Tx Hash</p>
            <p className="text-brand break-all">{election.txHash}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
