'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateElectionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    constituency: '',
    description: '',
    startTime: '',
    endTime: '',
    candidateIds: ['', ''],
  });
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'hi' | 'en'>('en');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/elections', {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      toast.success(language === 'hi' ? 'चुनाव सफलतापूर्वक ब्लॉकचेन पर परिनियोजित किया गया!' : 'Election successfully initialized on-chain!');
      router.push('/elections');
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'hi' ? 'चुनाव बनाने में विफल' : 'Failed to create election'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-brand text-4xl">add_circle</span>
            {language === 'hi' ? 'नया चुनाव प्रारंभ करें' : 'Initialize New Election'}
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            {language === 'hi' ? 'पॉलीगॉन ईवीएम सिस्टम पर एक चुनाव डिप्लॉय करें' : 'Deploy an immutable election smart contract on Polygon EVM'}
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

      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl border border-slate-700/50 space-y-8 relative overflow-hidden">
        
        {/* Form Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Section 1: Basic Info */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand font-bold">1</div>
            <h2 className="text-lg font-bold text-white">{language === 'hi' ? 'बुनियादी विवरण' : 'Basic Details'}</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {language === 'hi' ? 'चुनाव का शीर्षक' : 'Election Title'} <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'hi' ? 'जैसे: आम संसदीय चुनाव २०२६' : 'e.g., General Parliamentary Elections 2026'}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {language === 'hi' ? 'निर्वाचन क्षेत्र' : 'Constituency'} <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.constituency}
                onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                placeholder="DEL-001"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {language === 'hi' ? 'विवरण (वैकल्पिक)' : 'Description (Optional)'}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'hi' ? 'अतिरिक्त टिप्पणियां' : 'Additional context or notes'}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-700/50" />

        {/* Section 2: Timeline */}
        <div className="space-y-5">
           <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand font-bold">2</div>
            <h2 className="text-lg font-bold text-white">{language === 'hi' ? 'चुनाव की समय सीमा' : 'Election Timeline'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-400">play_circle</span>
                {language === 'hi' ? 'प्रारंभ समय' : 'Start Time'} <span className="text-brand">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-red-400">stop_circle</span>
                {language === 'hi' ? 'समाप्ति समय' : 'End Time'} <span className="text-brand">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-base text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 mt-6">
          <span className="material-symbols-outlined text-amber-400 text-3xl">warning</span>
          <div>
            <h4 className="text-sm font-bold text-amber-400 mb-1">
              {language === 'hi' ? 'अपरिवर्तनीय कार्रवाई' : 'Immutable Action'}
            </h4>
            <p className="text-xs text-slate-300">
               {language === 'hi' ? 'एक बार तैनात होने के बाद, चुनाव मापदंडों को स्मार्ट अनुबंध पर स्थायी रूप से दर्ज किया जाएगा और इसे बदला नहीं जा सकता।' : 'Once deployed, the election parameters will be permanently recorded on the smart contract and cannot be altered.'}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-4 bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-bold text-lg rounded-xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
               <span className="material-symbols-outlined animate-spin">sync</span>
               {language === 'hi' ? 'ब्लॉकचेन पर तैनात किया जा रहा है...' : 'Deploying to EVM Blockchain...'}
            </>
          ) : (
             <>
                <span className="material-symbols-outlined">rocket_launch</span>
                {language === 'hi' ? 'स्मार्ट अनुबंध तैनात करें' : 'Deploy Smart Contract Instance'}
             </>
          )}
        </button>
      </form>
    </div>
  );
}
