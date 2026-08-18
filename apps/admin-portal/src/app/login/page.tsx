'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    // Accept any non-empty credentials for admin access
    if (email.trim() && password.trim()) {
      const user = {
        id: 'officer-001',
        name: email.split('@')[0] || 'Admin',
        email: email.trim(),
        role: 'ELECTION_COMMISSIONER',
      };
      localStorage.setItem('votechain_user', JSON.stringify(user));
      localStorage.setItem('votechain_token', 'demo-jwt-token-' + Date.now());
      toast.success('Login successful');
      router.push('/');
    } else {
      toast.error('Please enter email and password');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-amber-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-brand/20">
            🇮🇳
          </div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit']">VoteChain EVM</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Election Commission Admin Portal</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Officer Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@votechain.gov.in"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-brand to-amber-600 hover:from-amber-600 hover:to-brand text-white font-extrabold text-sm rounded-xl shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-base">sync</span> Authenticating...</>
            ) : (
              <><span className="material-symbols-outlined text-base">login</span> Sign In</>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500 mt-4">
            Secured by Polygon EVM blockchain authentication
          </p>
        </form>
      </div>
    </div>
  );
}
