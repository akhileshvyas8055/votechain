'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Election {
  id: string;
  name: string;
  constituency: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'CREATED' | 'REGISTRATION' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CERTIFIED';
  totalVotes: number;
}

export function useElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/elections/active');
      setElections(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch elections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  return { elections, loading, error, refresh: fetchElections };
}
