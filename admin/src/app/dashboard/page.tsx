'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { PageHeader, StatCard } from '@/components/ui';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ data: DashboardStats }>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of platform activity" />
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Today's Matches" value={stats.todaysMatches} />
          <StatCard label="Live Matches" value={stats.liveMatches} />
          <StatCard label="Published Predictions" value={stats.publishedPredictions} />
          <StatCard label="Pending Signals" value={stats.pendingSignals} />
          <StatCard label="Premium Users" value={stats.premiumUsers} />
        </div>
      )}
    </div>
  );
}
