'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onNavClick?: () => void;
}

const navItems = [
  { label: 'Dashboard', labelHi: 'डैशबोर्ड', href: '/', icon: 'dashboard' },
  { label: 'Elections', labelHi: 'चुनाव प्रबंधन', href: '/elections', icon: 'ballot' },
  { label: 'New Election', labelHi: 'नया चुनाव', href: '/elections/create', icon: 'add_circle' },
  { label: 'Live Results', labelHi: 'लाइव परिणाम', href: '/results', icon: 'how_to_vote' },
  { label: 'Voter Enrollment', labelHi: 'मतदाता पंजीकरण', href: '/voters/register', icon: 'fingerprint' },
  { label: 'Audit Log', labelHi: 'ऑडिट लॉग', href: '/audit', icon: 'verified_user' },
];

export function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full py-4 space-y-4">
      {/* Node Status Summary */}
      <div className="px-4 mb-2">
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-lg">token</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Polygon Network</div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Contract Synchronized
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand to-amber-600 text-white shadow-lg shadow-brand/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <div className="flex flex-col">
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Action Button */}
      <div className="px-3 pt-2 border-t border-slate-800/80">
        <Link
          href="/elections/create"
          onClick={onNavClick}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-brand text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700/60 transition-all shadow-md group"
        >
          <span className="material-symbols-outlined text-[18px] text-brand group-hover:text-white transition-colors">
            rocket_launch
          </span>
          <span>Deploy Smart Contract</span>
        </Link>
      </div>
    </div>
  );
}
