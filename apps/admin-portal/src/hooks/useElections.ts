'use client';

import { useState, useEffect, useCallback } from 'react';
import * as store from '@/lib/electionStore';

export type { Election, Candidate } from '@/lib/electionStore';

export function useElections() {
  const [elections, setElections] = useState<store.Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElections = useCallback(() => {
    setLoading(true);
    try {
      const data = store.getAllElections();
      setElections(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch elections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  return { elections, loading, error, refresh: fetchElections };
}
