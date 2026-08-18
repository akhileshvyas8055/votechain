'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#102a43]/90 backdrop-blur-xl border-b-4 border-[#ff6600] shadow-xl">
      <div className="flex justify-between items-center px-8 h-20 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ff6600] flex items-center justify-center text-2xl shadow-lg border border-amber-300">
            🇮🇳
          </div>
          <div>
            <h1 className="font-['Outfit'] text-[20px] font-bold text-white flex items-center gap-2">
              {language === 'hi' ? 'भारत निर्वाचन आयोग' : 'Election Commission of India'}
            </h1>
            <p className="text-xs text-amber-400 font-mono">VoteChain EVM Administration Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                language === 'hi' ? 'bg-[#ff6600] text-slate-950' : 'text-slate-300'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                language === 'en' ? 'bg-[#ff6600] text-slate-950' : 'text-slate-300'
              }`}
            >
              ENG
            </button>
          </div>

          <button className="text-slate-300 hover:text-[#ff6600] transition">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-300 hover:text-[#ff6600] transition">
            <span className="material-symbols-outlined">settings</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
              <div className="text-xs text-right">
                <div className="font-bold text-white">{user.name}</div>
                <div className="text-emerald-400 text-[10px] uppercase font-mono">{user.role}</div>
              </div>
              <button onClick={logout} className="text-slate-300 hover:text-red-400 p-1" title="Logout">
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          ) : (
            <button className="px-6 py-2.5 bg-[#ff6600] hover:bg-[#e64d00] text-slate-950 font-bold text-xs rounded-full shadow-lg transition uppercase tracking-wider">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
