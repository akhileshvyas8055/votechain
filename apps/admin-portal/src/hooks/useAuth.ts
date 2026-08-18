'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('votechain_user');
    const token = localStorage.getItem('votechain_token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, officer } = response.data.data;

      localStorage.setItem('votechain_token', accessToken);
      localStorage.setItem('votechain_user', JSON.stringify(officer));

      setUser(officer);
      router.push('/');
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore cleanup error
    } finally {
      localStorage.removeItem('votechain_token');
      localStorage.removeItem('votechain_user');
      setUser(null);
      router.push('/login');
    }
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
