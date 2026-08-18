import React, { useState } from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';

export function OfficerOverrideScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '9999') {
      onUnlock();
    } else {
      alert('Invalid Booth Officer PIN');
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6">
      <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <h2 className="text-xl font-bold text-slate-100 uppercase">Booth Officer Security Override</h2>

      <form onSubmit={handleUnlock} className="space-y-4">
        <input
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="ENTER OFFICER PIN"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-xl font-mono text-slate-100 tracking-widest focus:outline-none focus:border-amber-500"
        />

        <button
          type="submit"
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
        >
          <KeyRound className="w-5 h-5" />
          <span>AUTHORIZE MACHINE RESET</span>
        </button>
      </form>
    </div>
  );
}
