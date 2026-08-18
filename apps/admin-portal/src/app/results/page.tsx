'use client';

import { useState } from 'react';
import { LiveVoteChart } from '@/components/results/LiveVoteChart';

export default function LiveResultsPage() {
  const [results] = useState([
    { candidateId: '1', candidateName: 'Elena Rostova', party: 'PROGRESSIVE ALLIANCE', votes: 8314400, percentage: 58.2 },
    { candidateId: '2', candidateName: 'Marcus Vance', party: 'NATIONAL PARTY', votes: 3500000, percentage: 24.5 },
    { candidateId: '3', candidateName: 'Sarah Jenkins', party: 'INDEPENDENT', votes: 1728600, percentage: 12.1 },
    { candidateId: '4', candidateName: 'Others', party: 'VARIOUS', votes: 742901, percentage: 5.2 },
  ]);

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
            <span className="text-outline text-sm font-data-mono">Block: #14892044</span>
          </div>
          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface">Global Presidential Election</h1>
          <p className="text-on-surface-variant mt-2 max-w-2xl">
            Real-time cryptographically verified election results. Data is immutable and synchronized across the VoteChain network.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn-outline px-4 py-2 rounded-lg font-label-caps flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
          <button className="btn-gradient px-4 py-2 rounded-lg font-label-caps flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">share</span> Share View
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Hero Leader Banner */}
        <div className="col-span-1 md:col-span-8 glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px] border-b border-primary/30" style={{ background: 'linear-gradient(135deg, rgba(38, 42, 51, 0.6) 0%, rgba(15, 19, 28, 0.8) 100%)' }}>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px]"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface/50 border border-surface-variant">
              <span className="material-symbols-outlined text-tertiary fill">emoji_events</span>
              <span className="font-label-caps text-on-surface">Current Leader</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-on-surface-variant mb-1">Total Votes Processed</div>
              <div className="font-data-mono text-xl text-primary drop-shadow-[0_0_8px_rgba(147,204,255,0.4)]">14,285,901</div>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full border-4 border-surface overflow-hidden shadow-[0_0_20px_rgba(147,204,255,0.3)] relative">
              <img
                src="/images/elena_rostova.png"
                alt="Elena Rostova Candidate Portrait"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-surface text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center border border-primary/30 font-data-mono text-sm">#1</div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="font-headline-lg text-4xl text-on-surface mb-1">Elena Rostova</h2>
              <div className="text-tertiary font-label-caps tracking-widest mb-4">PROGRESSIVE ALLIANCE</div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-data-mono">
                  <span className="text-primary font-bold text-2xl">58.2%</span>
                  <span className="text-on-surface-variant">Majority Secured</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/30">
                  <div className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full shadow-[0_0_10px_rgba(147,204,255,0.5)]" style={{ width: '58.2%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-gutter">
          <div className="glass-panel rounded-xl p-6 flex-1 glass-panel-hover transition-all">
            <div className="flex items-center gap-3 text-on-surface-variant mb-4">
              <span className="material-symbols-outlined">schedule</span>
              <h3 className="font-label-caps">Time Remaining</h3>
            </div>
            <div className="font-data-mono text-3xl text-on-surface">04h 12m 45s</div>
            <div className="mt-4 text-xs text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span> Ends at block #14894500
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 flex-1 glass-panel-hover transition-all">
            <div className="flex items-center gap-3 text-on-surface-variant mb-4">
              <span className="material-symbols-outlined">network_check</span>
              <h3 className="font-label-caps">Network Health</h3>
            </div>
            <div className="flex items-end gap-2">
              <div className="font-data-mono text-3xl text-secondary drop-shadow-[0_0_8px_rgba(78,222,163,0.3)]">99.9%</div>
              <div className="text-sm text-outline mb-1">Uptime</div>
            </div>
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

        {/* Audit Log Table */}
        <div className="col-span-1 md:col-span-12 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/50">
            <div>
              <h3 className="font-headline-lg text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">verified_user</span> Live Audit Log
              </h3>
              <p className="text-sm text-outline mt-1">Cryptographically signed transactions. Continuously indexing.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant/30 text-outline font-label-caps text-xs tracking-wider">
                  <th className="p-4 font-normal">Tx Index</th>
                  <th className="p-4 font-normal">Action</th>
                  <th className="p-4 font-normal">Wallet Address</th>
                  <th className="p-4 font-normal">Entity Hash</th>
                  <th className="p-4 font-normal">Booth ID</th>
                  <th className="p-4 font-normal text-right">Status</th>
                </tr>
              </thead>
              <tbody className="font-data-mono text-sm text-on-surface-variant">
                <tr className="border-b border-outline-variant/10 zebra-row hover:bg-surface-variant/50 transition-colors">
                  <td className="p-4 text-primary">892044-12</td>
                  <td className="p-4"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs border border-primary/20">VOTE_CAST</span></td>
                  <td className="p-4">0x8626...0A59</td>
                  <td className="p-4">0xfa892b...9e0f</td>
                  <td className="p-4 text-outline">B-Nyc-04</td>
                  <td className="p-4 text-right flex justify-end items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Verified
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/10 zebra-row hover:bg-surface-variant/50 transition-colors">
                  <td className="p-4 text-primary">892044-11</td>
                  <td className="p-4"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs border border-primary/20">VOTE_CAST</span></td>
                  <td className="p-4">0x44ab...992c</td>
                  <td className="p-4">0x11ab3c...4f2a</td>
                  <td className="p-4 text-outline">B-Lon-12</td>
                  <td className="p-4 text-right flex justify-end items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Verified
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
