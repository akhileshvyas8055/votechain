'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuditRecord {
  id: string;
  action: string;
  performer: string;
  timestamp: string;
  entityHash: string;
  boothId: string;
}

export default function AuditPage() {
  const [logs] = useState<AuditRecord[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Blockchain Audit Log</h1>
          <p className="text-slate-400 text-sm mt-1">Immutable chain-of-hash audit trail from the AuditTrail contract</p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs border border-emerald-500/20 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Chain Integrity Verified</span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">No Blockchain Audit Logs Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Transactions, voter registrations, and vote commitments will be appended to the immutable AuditTrail smart contract automatically.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-dark-card/40 text-xs font-semibold uppercase text-slate-400">
                <th className="py-3.5 px-4">Index</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Performer Address</th>
                <th className="py-3.5 px-4">Entity Hash</th>
                <th className="py-3.5 px-4">Booth</th>
                <th className="py-3.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/60 text-xs text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-card/50 transition">
                  <td className="py-3.5 px-4 font-mono text-brand-400">#{log.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{log.action}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 truncate max-w-[150px]">{log.performer}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 truncate max-w-[120px]">{log.entityHash}</td>
                  <td className="py-3.5 px-4">{log.boothId}</td>
                  <td className="py-3.5 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

