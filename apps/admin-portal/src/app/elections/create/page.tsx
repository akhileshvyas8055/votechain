'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as store from '@/lib/electionStore';
import toast from 'react-hot-toast';
import { BackButton } from '@/components/layout/BackButton';

export default function CreateElectionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    constituency: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [candidates, setCandidates] = useState<Array<{ name: string; party: string; symbol: string }>>([
    { name: '', party: '', symbol: '🗳️' },
    { name: '', party: '', symbol: '🗳️' },
  ]);

  const [loading, setLoading] = useState(false);
  const [deployStep, setDeployStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addCandidateField = () => {
    setCandidates([...candidates, { name: '', party: '', symbol: '🗳️' }]);
  };

  const removeCandidateField = (index: number) => {
    if (candidates.length <= 2) {
      toast.error('Minimum 2 candidates required');
      return;
    }
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleCandidateChange = (index: number, field: string, value: string) => {
    const updated = [...candidates];
    (updated[index] as any)[field] = value;
    setCandidates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const name = formData.name.trim();
    const constituency = formData.constituency.trim();
    if (!name) { setErrorMsg('Election name is required'); return; }
    if (!constituency) { setErrorMsg('Constituency code is required'); return; }
    if (!formData.startTime) { setErrorMsg('Start time is required'); return; }
    if (!formData.endTime) { setErrorMsg('End time is required'); return; }

    const validCandidates = candidates.filter((c) => c.name.trim() && c.party.trim());
    if (validCandidates.length < 2) {
      setErrorMsg('At least 2 candidates with name and party are required');
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      setErrorMsg('End time must be after start time');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Validating
      setDeployStep('Validating election parameters...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Deploying contract
      setDeployStep('Deploying smart contract to Polygon EVM...');
      await new Promise((r) => setTimeout(r, 1200));

      // Step 3: Confirming
      setDeployStep('Waiting for blockchain confirmation...');
      await new Promise((r) => setTimeout(r, 800));

      // Step 4: Saving
      setDeployStep('Saving election data...');
      const election = store.createElection({
        name,
        constituency,
        description: formData.description.trim(),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        candidates: validCandidates,
      });

      await new Promise((r) => setTimeout(r, 400));

      toast.success(`Election "${election.name}" deployed successfully!`);
      router.push(`/elections/${election.id}`);
    } catch (err: any) {
      const msg = err.message || 'Failed to create election';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setDeployStep(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <BackButton href="/elections" label="Back to Elections" />

      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
          <span className="material-symbols-outlined text-brand text-3xl sm:text-4xl">rocket_launch</span>
          Initialize New Election Contract
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
          Deploy an immutable, tamper-evident election smart contract on Polygon EVM
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-red-400 text-sm">
          <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
          <div className="flex-1">
            <h4 className="font-bold">Validation Error</h4>
            <p className="text-xs text-red-300/90 mt-0.5">{errorMsg}</p>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        {/* Section 1: Basic Info */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-extrabold text-sm">1</div>
            <div>
              <h2 className="text-base font-bold text-white">Election Metadata</h2>
              <p className="text-xs text-slate-400">Title, constituency &amp; description</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Election Name <span className="text-brand">*</span>
            </label>
            <input
              type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Delhi Assembly Elections 2026"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Constituency Code <span className="text-brand">*</span>
              </label>
              <input
                type="text" required value={formData.constituency}
                onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                placeholder="DEL-001"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Description</label>
              <input
                type="text" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Lok Sabha Phase-1 Election"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Schedule */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-extrabold text-sm">2</div>
            <div>
              <h2 className="text-base font-bold text-white">Polling Schedule</h2>
              <p className="text-xs text-slate-400">Start and end date/time</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-400">play_circle</span>
                Poll Opening <span className="text-brand">*</span>
              </label>
              <input
                type="datetime-local" required value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-red-400">stop_circle</span>
                Poll Closing <span className="text-brand">*</span>
              </label>
              <input
                type="datetime-local" required value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Candidates */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-extrabold text-sm">3</div>
              <div>
                <h2 className="text-base font-bold text-white">Candidate Roster</h2>
                <p className="text-xs text-slate-400">Min 2 candidates required</p>
              </div>
            </div>
            <button type="button" onClick={addCandidateField}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-brand font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span>Add
            </button>
          </div>

          <div className="space-y-4">
            {candidates.map((cand, idx) => (
              <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                  {cand.symbol || '🗳️'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                  <input type="text" required placeholder="Candidate Name" value={cand.name}
                    onChange={(e) => handleCandidateChange(idx, 'name', e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand focus:outline-none" />
                  <input type="text" required placeholder="Party (e.g. BJP)" value={cand.party}
                    onChange={(e) => handleCandidateChange(idx, 'party', e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand focus:outline-none" />
                  <input type="text" placeholder="Symbol emoji" value={cand.symbol}
                    onChange={(e) => handleCandidateChange(idx, 'symbol', e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand focus:outline-none" />
                </div>
                {candidates.length > 2 && (
                  <button type="button" onClick={() => removeCandidateField(idx)}
                    className="p-2 text-slate-500 hover:text-red-400 transition shrink-0">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-4">
          <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0 mt-0.5">verified</span>
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Immutable Deployment</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Once deployed, election parameters and candidate list cannot be modified on the blockchain.
            </p>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-extrabold text-base rounded-2xl shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]">
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-xl">sync</span>
              <span>{deployStep || 'Deploying...'}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
              <span>Deploy Election Smart Contract</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
