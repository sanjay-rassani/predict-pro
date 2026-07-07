'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { AsyncState, PageHeader, StatCard } from '@/components/ui';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ data: DashboardStats }>('/admin/stats');
      setStats(res.data);
    } catch (err) {
      setStats(null);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of platform activity" />
      <AsyncState
        loading={loading}
        error={error}
        empty={!stats}
        emptyMessage="No dashboard data available"
        onRetry={load}
      >
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Today's Matches" value={stats.todaysMatches} />
            <StatCard label="Live Matches" value={stats.liveMatches} />
            <StatCard label="Published Predictions" value={stats.publishedPredictions} />
            <StatCard label="Pending Signals" value={stats.pendingSignals} />
            <StatCard label="Premium Users" value={stats.premiumUsers} />
          </div>
        )}
      </AsyncState>
    </div>
  );
}
