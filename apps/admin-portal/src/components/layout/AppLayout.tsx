'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not show full layout wrapper on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative">
      {/* Fixed Top Navbar */}
      <Navbar
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-slate-900/90 backdrop-blur-2xl border-r border-slate-800/80 z-30">
        <Sidebar />
      </aside>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed top-16 bottom-0 left-0 w-72 bg-slate-900/95 border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavClick={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Page Content Container */}
      <main className="pt-16 md:ml-64 min-h-screen transition-all">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
