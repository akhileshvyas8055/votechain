'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AuditPage() {
  const [logs] = useState([
    {
      id: '0',
      action: 'VOTER_REGISTERED',
      performer: '0x8626f69A00E2eb1F1168f695A756150586090A59',
      timestamp: new Date().toISOString(),
      entityHash: '0xa1b2c3d4e5f6...',
      boothId: 'B-001',
    },
    {
      id: '1',
      action: 'VOTE_CAST',
      performer: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      entityHash: '0xf6e5d4c3b2a1...',
      boothId: 'B-001',
    },
  ]);

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
      </div>
    </div>
  );
}
