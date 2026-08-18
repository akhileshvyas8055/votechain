'use client';

import { useState, useEffect } from 'react';
import { LiveVoteChart } from '@/components/results/LiveVoteChart';
import { api } from '@/lib/api';

interface ResultItem {
  candidateId: string;
  candidateName: string;
  party: string;
  votes: number;
  percentage: number;
}

export default function LiveResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState<number>(0);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        // Attempt to fetch active election results if backend provides endpoint,
        // otherwise default to empty state until election starts.
        const res = await api.get('/elections/active');
        const activeElections = res.data.data || [];
        if (activeElections.length > 0 && activeElections[0].candidates) {
          const candidates = activeElections[0].candidates;
          const total = candidates.reduce((sum: number, c: any) => sum + (c.votes || 0), 0);
          setTotalVotes(total);
          setResults(candidates.map((c: any) => ({
            candidateId: c.id,
            candidateName: c.name,
            party: c.party || 'Independent',
            votes: c.votes || 0,
            percentage: total > 0 ? Number(((c.votes || 0) / total * 100).toFixed(1)) : 0,
          })));
        } else {
          setResults([]);
          setTotalVotes(0);
        }
      } catch (err) {
        console.error('Failed to fetch election results:', err);
        setResults([]);
        setTotalVotes(0);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  const leader = results.length > 0 ? [...results].sort((a, b) => b.votes - a.votes)[0] : null;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary live-indicator"></div>
              <span className="text-secondary font-label-caps text-[10px]">LIVE TALLY</span>
            </div>
            <span className="text-outline text-sm font-data-mono">Blockchain Verified</span>
          </div>
          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface">Election Live Results</h1>
          <p className="text-on-surface-variant mt-2 max-w-2xl">
            Real-time cryptographically verified election results. Data is immutable and synchronized across the VoteChain network.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-400">Loading live election results...</div>
      ) : results.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-slate-600">bar_chart</span>
          <h2 className="text-xl font-bold text-slate-200">No Active Election Votes Recorded</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Once an election is deployed and votes are cast via EVM machine kiosks, real-time verified tallies will appear here automatically.
          </p>
        </div>
      ) : (
        /* Bento Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Hero Leader Banner */}
          {leader && (
            <div className="col-span-1 md:col-span-8 glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[260px] border-b border-primary/30" style={{ background: 'linear-gradient(135deg, rgba(38, 42, 51, 0.6) 0%, rgba(15, 19, 28, 0.8) 100%)' }}>
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface/50 border border-surface-variant">
                  <span className="material-symbols-outlined text-tertiary fill">emoji_events</span>
                  <span className="font-label-caps text-on-surface">Leading Candidate</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-on-surface-variant mb-1">Total Votes Processed</div>
                  <div className="font-data-mono text-xl text-primary">{totalVotes.toLocaleString()}</div>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="font-headline-lg text-3xl text-on-surface mb-1">{leader.candidateName}</h2>
                  <div className="text-tertiary font-label-caps tracking-widest mb-3">{leader.party}</div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-data-mono">
                      <span className="text-primary font-bold text-2xl">{leader.percentage}%</span>
                      <span className="text-on-surface-variant">{leader.votes.toLocaleString()} Votes</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/30">
                      <div className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full" style={{ width: `${leader.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-gutter">
            <div className="glass-panel rounded-xl p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 text-on-surface-variant mb-2">
                <span className="material-symbols-outlined">network_check</span>
                <h3 className="font-label-caps">Network Consensus</h3>
              </div>
              <div className="font-data-mono text-2xl text-secondary">ACTIVE</div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="col-span-1 md:col-span-12 glass-panel rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-lg text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bar_chart</span> Candidate Distribution
              </h3>
            </div>
            <LiveVoteChart results={results} />
          </div>
        </div>
      )}
    </div>
  );
}

