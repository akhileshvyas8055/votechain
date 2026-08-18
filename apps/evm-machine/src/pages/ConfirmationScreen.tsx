import { useEffect } from 'react';
import { CheckCircle2, Printer } from 'lucide-react';

export function ConfirmationScreen({
  candidate,
  onComplete,
}: {
  candidate: any;
  onComplete: () => void;
}) {
  useEffect(() => {
    // Audio beep simulation & VVPAT print simulation
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-3xl p-10 text-center shadow-2xl space-y-6">
      <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
        <CheckCircle2 className="w-16 h-16 animate-bounce" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-100 uppercase">VOTE CAST SUCCESSFULLY</h2>
        <p className="text-sm text-slate-400 mt-2">Recorded on Polygon EVM Smart Contract</p>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs font-mono text-slate-300 space-y-1">
        <div className="flex items-center space-x-2 text-sky-400 font-bold mb-2">
          <Printer className="w-4 h-4" />
          <span>VVPAT PAPER SLIP PRINTED</span>
        </div>
        <div>CANDIDATE: {candidate.name}</div>
        <div>PARTY: {candidate.party}</div>
        <div>TIMESTAMP: {new Date().toLocaleTimeString()}</div>
      </div>

      <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
        RETURNING TO IDLE SCREEN IN 5 SECONDS...
      </div>
    </div>
  );
}
