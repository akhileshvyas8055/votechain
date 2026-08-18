'use client';

import Link from 'next/link';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BackButton({ href = '/elections', label = 'Back to Elections', className = '' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold shadow-md transition-all group ${className}`}
    >
      <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform text-brand">
        arrow_back
      </span>
      <span>{label}</span>
    </Link>
  );
}
