'use client';

import { useElections } from '@/hooks/useElections';
import { ElectionCard } from '@/components/elections/ElectionCard';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ElectionsPage() {
  const { elections, loading } = useElections();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Election Management</h1>
          <p className="text-slate-400 text-sm mt-1">Configure and manage blockchain election states</p>
        </div>
        <Link
          href="/elections/create"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-sky-400 text-white font-medium rounded-xl text-sm shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Election</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading elections...</div>
      ) : elections.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 border border-dark-border">
          No elections found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((election) => (
            <ElectionCard key={election.id} election={election} />
          ))}
        </div>
      )}
    </div>
  );
}
