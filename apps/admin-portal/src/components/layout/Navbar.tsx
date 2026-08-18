'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import Link from 'next/link';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export function Navbar({ onToggleMobileMenu, mobileMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const { account, connectWallet, disconnectWallet } = useWeb3();
  const [language, setLanguage] = useState<'hi' | 'en'>('en');

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl h-16">
      <div className="flex justify-between items-center px-4 md:px-8 h-full max-w-7xl mx-auto">
        
        {/* Left: Brand & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform">
              🇮🇳
            </div>
            <div>
              <h1 className="font-['Outfit'] text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
                {language === 'hi' ? 'भारत निर्वाचन आयोग' : 'VoteChain EVM'}
              </h1>
              <p className="text-[10px] text-brand font-mono tracking-wider font-semibold">
                Election Commission Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Actions, Language, User/Wallet */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="hidden sm:flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                language === 'hi' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                language === 'en' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              ENG
            </button>
          </div>

          {/* Node Status Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="relative w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[11px] font-bold text-emerald-400 font-mono">Polygon EVM Active</span>
          </div>

          {/* Web3 Wallet Button */}
          {account ? (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs text-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              <button
                type="button"
                onClick={disconnectWallet}
                className="text-slate-500 hover:text-red-400 ml-1"
                title="Disconnect Wallet"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              className="px-4 py-2 bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-extrabold text-xs rounded-xl shadow-lg shadow-brand/20 transition-all uppercase tracking-wider flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              <span>Connect Wallet</span>
            </button>
          )}

          {user && (
            <div className="flex items-center gap-3 bg-slate-900/90 pl-3 pr-1.5 py-1.5 rounded-full border border-slate-800">
              <div className="text-xs text-right hidden xs:block">
                <div className="font-bold text-white leading-tight">{user.name}</div>
                <div className="text-emerald-400 text-[10px] uppercase font-mono">{user.role}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-colors"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
