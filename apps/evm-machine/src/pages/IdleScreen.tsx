import { ShieldCheck, Touchpad } from 'lucide-react';

export function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      onClick={onStart}
      className="w-full max-w-2xl bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center cursor-pointer hover:border-sky-500/50 transition duration-500 shadow-2xl flex flex-col items-center justify-center space-y-8"
    >
      <div className="p-6 bg-sky-500/10 rounded-full text-sky-400 border border-sky-500/20 glow-blue">
        <ShieldCheck className="w-20 h-20 animate-pulse" />
      </div>

      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-slate-100 uppercase">
          EVM Voting Terminal
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Election Commission of India / District-1 Constituency
        </p>
      </div>

      <div className="flex items-center space-x-3 text-sky-400 text-lg font-bold bg-sky-500/10 px-8 py-4 rounded-2xl border border-sky-500/20 animate-bounce">
        <Touchpad className="w-6 h-6" />
        <span>TOUCH SCREEN TO BEGIN VOTING</span>
      </div>
    </div>
  );
}
