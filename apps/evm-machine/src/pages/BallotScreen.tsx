import React from 'react';
import { Sun, Trees, Flag, Vote } from 'lucide-react';

const CANDIDATES = [
  { id: '1', name: 'JOHN DOE', party: 'PROGRESSIVE ALLIANCE', symbol: 'Sun', icon: Sun },
  { id: '2', name: 'JANE SMITH', party: 'NATIONAL PARTY', symbol: 'Tree', icon: Trees },
  { id: '3', name: 'ALICE JOHNSON', party: 'INDEPENDENT', symbol: 'Flag', icon: Flag },
];

export function BallotScreen({
  fingerprint,
  onVoteCast,
}: {
  fingerprint: string;
  onVoteCast: (candidate: any) => void;
}) {
  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100 uppercase">OFFICIAL BALLOT UNIT</h2>
        <p className="text-xs text-slate-400 mt-1">Press the BLUE BUTTON next to your preferred candidate</p>
      </div>

      <div className="space-y-4">
        {CANDIDATES.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:border-slate-700 transition"
            >
              <div className="flex items-center space-x-6">
                <div className="p-3 bg-slate-800 rounded-xl text-slate-200">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{c.name}</h3>
                  <p className="text-xs font-semibold text-sky-400">{c.party}</p>
                </div>
              </div>

              <button
                onClick={() => onVoteCast(c)}
                className="px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl shadow-lg border-b-4 border-sky-800 active:border-b-0 active:translate-y-1 transition text-lg tracking-wider flex items-center space-x-2"
              >
                <Vote className="w-6 h-6" />
                <span>VOTE</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
