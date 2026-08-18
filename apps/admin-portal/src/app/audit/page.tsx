'use client';

import { useState, useEffect } from 'react';
import * as store from '@/lib/electionStore';
import { BackButton } from '@/components/layout/BackButton';

export default function AuditPage() {
  const [entries, setEntries] = useState<store.AuditEntry[]>([]);

  const fetchAudit = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/mock/data`);
      const data = await res.json();
      if (data.success !== false && data.audit) {
        setEntries(data.audit);
      } else {
        setEntries(store.getAllAuditEntries());
      }
    } catch {
      setEntries(store.getAllAuditEntries());
    }
  };

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <BackButton href="/" label="Back to Dashboard" />

      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-400 text-3xl sm:text-4xl">verified_user</span>
          Blockchain Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
          Immutable transaction log • {entries.length} entries recorded
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <span className="material-symbols-outlined text-5xl text-slate-600">security</span>
            <p className="text-sm font-semibold text-slate-300">No Audit Entries Yet</p>
            <p className="text-xs text-slate-500">Create an election or register a voter to generate audit trail entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40">
                  <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Tx Hash</th>
                  <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Action</th>
                  <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Entity</th>
                  <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Performed By</th>
                  <th className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Time</th>
                  <th className="text-right text-[11px] text-slate-400 font-bold uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-brand text-xs">{entry.txHash.slice(0, 10)}...{entry.txHash.slice(-4)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{entry.entityType}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{entry.performedBy}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs font-semibold text-emerald-400">{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
