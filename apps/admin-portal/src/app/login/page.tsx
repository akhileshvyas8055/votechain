'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ShieldCheck, Lock, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.success('Welcome back!');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl border border-dark-border glow-blue">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 text-brand-500 mb-4 border border-brand-500/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Commission Login</h1>
          <p className="text-slate-400 text-sm mt-1">
            Access VoteChain Security & Election Management Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Official Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ec@votechain.io"
                className="w-full bg-dark-bg/60 border border-dark-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-dark-bg/60 border border-dark-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-sky-400 text-white font-medium rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Portal</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Protected by 256-bit EVM Cryptographic Auth
        </div>
      </div>
    </div>
  );
}
