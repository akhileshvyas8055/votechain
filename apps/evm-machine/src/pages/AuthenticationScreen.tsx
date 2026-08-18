import { useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';

export function AuthenticationScreen({
  onAuthSuccess,
}: {
  onAuthSuccess: (fpTemplate: string) => void;
}) {
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    setTimeout(() => {
      const dummyTemplate = Buffer.from(`FP-VOTER-${Date.now()}`).toString('base64');
      setScanning(false);
      onAuthSuccess(dummyTemplate);
    }, 2000);
  };

  return (
    <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-bold text-slate-100 uppercase">
        Voter Authentication
      </h2>
      <p className="text-sm text-slate-400">
        Place your registered finger on the optical sensor below
      </p>

      <div
        onClick={!scanning ? handleScan : undefined}
        className={`p-8 rounded-full border-4 cursor-pointer transition duration-300 ${
          scanning
            ? 'border-sky-500 bg-sky-500/20 text-sky-400'
            : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-sky-500/50'
        }`}
      >
        {scanning ? (
          <Loader2 className="w-24 h-24 animate-spin" />
        ) : (
          <Fingerprint className="w-24 h-24" />
        )}
      </div>

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {scanning ? 'VERIFYING BIOMETRICS ON CHAIN...' : 'TAP FINGERPRINT ICON TO SCAN'}
      </div>
    </div>
  );
}
