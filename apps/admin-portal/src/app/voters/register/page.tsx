'use client';

import { useState } from 'react';
import * as store from '@/lib/electionStore';
import toast from 'react-hot-toast';
import { BackButton } from '@/components/layout/BackButton';

export default function RegisterVoterPage() {
  const [formData, setFormData] = useState({
    voterIdNumber: '',
    name: '',
    dateOfBirth: '',
    constituency: '',
    district: 'New Delhi',
    state: 'Delhi',
  });

  const [isScanning, setIsScanning] = useState(false);
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [loading, setLoading] = useState(false);

  const simulateScan = () => {
    setIsScanning(true);
    setFingerprintCaptured(false);
    setTimeout(() => {
      setIsScanning(false);
      setFingerprintCaptured(true);
      toast.success('Biometric fingerprint template captured!');
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fingerprintCaptured) {
      toast.error('Please scan voter fingerprint first');
      return;
    }
    if (!formData.voterIdNumber.trim() || !formData.name.trim() || !formData.dateOfBirth || !formData.constituency.trim()) {
      toast.error('All required fields must be filled');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      store.registerVoter({
        voterIdNumber: formData.voterIdNumber.trim().toUpperCase(),
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth,
        constituency: formData.constituency.trim().toUpperCase(),
        district: formData.district.trim(),
        state: formData.state.trim(),
      });
      toast.success('Voter registered successfully on Polygon EVM!');
      setFormData({ voterIdNumber: '', name: '', dateOfBirth: '', constituency: '', district: 'New Delhi', state: 'Delhi' });
      setFingerprintCaptured(false);
    } catch (err: any) {
      toast.error(err.message || 'Voter registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <BackButton href="/" label="Back to Dashboard" />

      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-brand text-3xl sm:text-4xl">fingerprint</span>
          Biometric Voter Enrollment
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">Secure voter registration on Polygon EVM</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="glass-card p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">badge</span> Voter Details
            </h2>

            <form id="voter-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Voter ID (EPIC) <span className="text-brand">*</span>
                </label>
                <input type="text" required value={formData.voterIdNumber}
                  onChange={(e) => setFormData({ ...formData, voterIdNumber: e.target.value })}
                  placeholder="EPIC-987654321"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono uppercase tracking-wider" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name <span className="text-brand">*</span>
                </label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ramesh Kumar"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Date of Birth <span className="text-brand">*</span>
                  </label>
                  <input type="date" required value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Constituency <span className="text-brand">*</span>
                  </label>
                  <input type="text" required value={formData.constituency}
                    onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                    placeholder="DEL-001"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono uppercase" />
                </div>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-400">lock</span>
            Biometric data encrypted with SHA-256 before chain write
          </div>
        </div>

        {/* Right: Scanner */}
        <div className={`glass-card p-6 sm:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden ${isScanning ? 'border-brand/50' : ''}`}>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Fingerprint Scanner</h2>
            <p className="text-xs text-slate-400 mb-6">Tap the sensor to capture biometric template</p>
          </div>

          <div onClick={simulateScan} className="relative w-44 h-44 cursor-pointer group my-2">
            <div className={`absolute inset-0 border ${isScanning ? 'border-brand/40 animate-[spin_3s_linear_infinite]' : 'border-slate-700'} rounded-full transition-colors`} />
            <div className={`absolute inset-2 border ${isScanning ? 'border-brand/60 animate-[spin_2s_linear_infinite_reverse]' : 'border-slate-700'} rounded-full transition-colors`} />
            <div className={`absolute inset-4 rounded-full ${isScanning ? 'bg-brand/20' : 'bg-slate-950'} border ${isScanning ? 'border-brand' : 'border-slate-800'} flex items-center justify-center overflow-hidden transition-all group-hover:border-brand/50`}>
              <span className={`material-symbols-outlined text-7xl transition-all ${isScanning ? 'text-brand animate-pulse' : fingerprintCaptured ? 'text-emerald-400' : 'text-slate-600 group-hover:text-brand/60'}`}>
                fingerprint
              </span>
            </div>
          </div>

          <div className="my-4">
            {isScanning ? (
              <div className="font-mono text-xs text-brand uppercase tracking-wider flex items-center gap-2 animate-pulse font-bold">
                <span className="w-2 h-2 rounded-full bg-brand animate-ping" /> Scanning...
              </div>
            ) : fingerprintCaptured ? (
              <div className="font-mono text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-bold bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> CAPTURED
              </div>
            ) : (
              <div className="font-mono text-xs text-slate-400 uppercase tracking-wider bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                TAP TO SCAN
              </div>
            )}
          </div>

          <button type="submit" form="voter-form" disabled={loading || !fingerprintCaptured}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20">
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-base">sync</span> Registering...</>
            ) : (
              <><span className="material-symbols-outlined text-base">link</span> Register Voter</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
