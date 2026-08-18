'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'मुख्य डैशबोर्ड / Dashboard', href: '/', icon: 'dashboard' },
  { name: 'लाइव परिणाम / Live Results', href: '/results', icon: 'how_to_vote' },
  { name: 'मतदाता पंजीकरण / Verification', href: '/voters/register', icon: 'fingerprint' },
  { name: 'ऑडिट लॉग / Audit Log', href: '/audit', icon: 'receipt_long' },
  { name: 'चुनाव प्रबंधन / Elections', href: '/elections', icon: 'hub' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 bg-[#102a43]/90 backdrop-blur-2xl border-r border-slate-800 shadow-2xl py-6 gap-4 pt-28">
      <div className="px-6 mb-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center relative border border-slate-700 overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 live-indicator"></div>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-100">Mainnet Node</div>
          <div className="text-[10px] text-emerald-400 font-mono animate-pulse">Synced & Verified</div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#ff6600] text-slate-950 shadow-lg border-l-4 border-amber-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-4 border-t border-slate-800 space-y-4">
        <Link
          href="/elections/create"
          className="w-full py-3.5 rounded-xl bg-[#ff6600] hover:bg-[#e64d00] text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          नया चुनाव / Create Election
        </Link>
      </div>
    </aside>
  );
}
