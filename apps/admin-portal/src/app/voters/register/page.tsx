'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function RegisterVoterPage() {
  const [formData, setFormData] = useState({
    voterIdNumber: '',
    name: '',
    dateOfBirth: '',
    constituency: '',
    district: '',
    state: '',
  });

  const [isScanning, setIsScanning] = useState(false);
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [templateBase64, setTemplateBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'hi' | 'en'>('en');

  const simulateScan = () => {
    setIsScanning(true);
    setFingerprintCaptured(false);

    setTimeout(() => {
      setIsScanning(false);
      const dummyTemplate = Buffer.from(`FP-TEMPLATE-${Date.now()}`).toString('base64');
      setTemplateBase64(dummyTemplate);
      setFingerprintCaptured(true);
      toast.success(language === 'hi' ? 'फिंगरप्रिंट टेम्पलेट कैप्चर हो गया!' : 'Fingerprint template captured!');
    }, 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fingerprintCaptured) {
      toast.error(language === 'hi' ? 'कृपया पहले मतदाता के फिंगरप्रिंट को स्कैन करें' : 'Please scan voter fingerprint first');
      return;
    }

    setLoading(true);
    try {
      await api.post('/voters/register', {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        fingerprintTemplateBase64: templateBase64,
      });
      toast.success(language === 'hi' ? 'मतदाता सफलतापूर्वक ब्लॉकचेन पर पंजीकृत हो गया!' : 'Voter registered on blockchain!');
      setFormData({ voterIdNumber: '', name: '', dateOfBirth: '', constituency: '', district: '', state: '' });
      setFingerprintCaptured(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'hi' ? 'मतदाता पंजीकरण विफल' : 'Voter registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-brand text-4xl">fingerprint</span>
            {language === 'hi' ? 'बायोमेट्रिक मतदाता नामांकन टर्मिनल' : 'Biometric Voter Enrollment Terminal'}
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            {language === 'hi' ? 'वोटचेन नेटवर्क पर सुरक्षित, अपरिवर्तनीय पहचान पंजीकरण।' : 'Secure, immutable identity registration on the VoteChain Network.'}
          </p>
        </div>
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                language === 'hi' ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                language === 'en' ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              ENG
            </button>
          </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Form Panel */}
        <div className="glass-card rounded-2xl p-8 flex flex-col justify-between border border-slate-700/50 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
           
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">badge</span>
              {language === 'hi' ? 'मतदाता विवरण' : 'Voter Details'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                   {language === 'hi' ? 'राष्ट्रीय मतदाता आईडी' : 'National Voter ID'} <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.voterIdNumber}
                  onChange={(e) => setFormData({ ...formData, voterIdNumber: e.target.value })}
                  placeholder="A1B2-C3D4-E5F6"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {language === 'hi' ? 'पूरा कानूनी नाम' : 'Full Legal Name'} <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'hi' ? 'रिकॉर्ड के अनुसार पूरा नाम दर्ज करें' : 'Enter full name as per records'}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                     {language === 'hi' ? 'जन्म तिथि' : 'Date of Birth'} <span className="text-brand">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    {language === 'hi' ? 'निर्वाचन क्षेत्र' : 'Constituency Code'} <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.constituency}
                    onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                    placeholder="e.g. D1-04"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono uppercase"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">lock</span>
             {language === 'hi' ? 'ट्रांसमिशन से पहले डेटा को स्थानीय रूप से एन्क्रिप्ट किया गया है।' : 'Data encrypted locally before transmission.'}
          </div>
        </div>

        {/* Right Biometric Scanner Panel */}
        <div className={`glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-700/50 ${isScanning ? 'border-brand/50 bg-brand/5' : ''}`}>
           {isScanning && <div className="absolute inset-0 bg-brand/10 animate-pulse"></div>}

          <h2 className="text-xl font-bold text-white mb-2 z-10">
             {language === 'hi' ? 'बायोमेट्रिक सत्यापन' : 'Biometric Verification'}
          </h2>
          <p className="text-sm text-slate-400 mb-10 z-10">
             {language === 'hi' ? 'कृपया अपनी तर्जनी उंगली नीचे ऑप्टिकल स्कैनर पर रखें।' : 'Please place your index finger on the optical scanner below.'}
          </p>

          {/* Scanner Touch Circle */}
          <div onClick={simulateScan} className="relative w-48 h-48 mb-8 z-10 cursor-pointer group">
            <div className={`absolute inset-0 border ${isScanning ? 'border-brand/40 animate-[spin_3s_linear_infinite]' : 'border-slate-700'} rounded-full transition-colors`}></div>
            <div className={`absolute inset-2 border ${isScanning ? 'border-brand/60 animate-[spin_2s_linear_infinite_reverse]' : 'border-slate-700'} rounded-full transition-colors`}></div>
            <div className={`absolute inset-4 rounded-full ${isScanning ? 'bg-brand/20' : 'bg-slate-900'} border ${isScanning ? 'border-brand' : 'border-slate-700'} flex items-center justify-center overflow-hidden transition-all group-hover:border-brand/50`}>
              <span className={`material-symbols-outlined text-[100px] transition-all duration-300 ${isScanning ? 'text-brand animate-pulse' : fingerprintCaptured ? 'text-emerald-400' : 'text-slate-600 group-hover:text-brand/50'}`}>
                fingerprint
              </span>
              {isScanning && <div className="absolute top-0 left-0 w-full h-1 bg-brand shadow-[0_0_15px_rgba(255,102,0,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>}
            </div>
          </div>

          {/* Status Display */}
          <div className="h-10 mb-6 z-10 flex items-center justify-center">
            {isScanning ? (
              <div className="font-mono text-sm text-brand uppercase tracking-widest flex items-center gap-2 animate-pulse font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-brand animate-ping"></span> {language === 'hi' ? 'बायोमेट्रिक्स स्कैन हो रहा है...' : 'SCANNING BIOMETRICS...'}
              </div>
            ) : fingerprintCaptured ? (
              <div className="font-mono text-sm text-emerald-400 uppercase tracking-widest flex items-center gap-2 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> {language === 'hi' ? 'फिंगरप्रिंट टेम्पलेट कैप्चर हुआ' : 'FINGERPRINT TEMPLATE CAPTURED'}
              </div>
            ) : (
              <div className="font-mono text-sm text-slate-500 uppercase tracking-widest bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50">
                 {language === 'hi' ? 'स्कैन करने के लिए फिंगरप्रिंट सर्कल पर टैप करें' : 'TAP FINGERPRINT CIRCLE TO SCAN'}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !fingerprintCaptured}
            className="w-full py-4 mt-auto rounded-xl bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
          >
             {loading ? (
                <>
                   <span className="material-symbols-outlined animate-spin">sync</span>
                   {language === 'hi' ? 'ब्लॉकचेन पर सबमिट किया जा रहा है...' : 'Submitting to Blockchain...'}
                </>
             ) : (
                <>
                   <span className="material-symbols-outlined">link</span>
                   {language === 'hi' ? 'मतदाता को ब्लॉकचेन पर पंजीकृत करें' : 'Register Voter on Blockchain'}
                </>
             )}
          </button>
        </div>
      </div>
    </div>
  );
}
