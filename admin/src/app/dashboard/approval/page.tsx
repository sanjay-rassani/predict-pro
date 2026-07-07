'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Prediction } from '@/lib/types';
import { AsyncState, Badge, Button, PageHeader } from '@/components/ui';

export default function ApprovalPage() {
  const [signals, setSignals] = useState<Prediction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ data: Prediction[] }>(
        '/predictions?approval_status=pending&include_archived=false',
      );
      setSignals(res.data.filter((p) => p.is_automated_signal));
    } catch (err) {
      setSignals([]);
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: number) => {
    try {
      await api(`/predictions/${id}/approve`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    }
  };

  const reject = async (id: number) => {
    try {
      await api(`/predictions/${id}/reject`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Approval Queue"
        subtitle="Review automated Surprise and Comeback signals before they go live"
      />

      <AsyncState
        loading={loading}
        error={error}
        empty={signals.length === 0}
        emptyMessage="No pending signals"
        onRetry={load}
      >
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Pick</th>
                <th className="px-4 py-3">Odds</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3 text-white">
                    {p.home_team} vs {p.away_team}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="purple">{p.type}</Badge>
                  </td>
                  <td className="px-4 py-3">{p.predicted_value}</td>
                  <td className="px-4 py-3">{p.odds ?? '—'}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-400">{p.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button onClick={() => approve(p.id)}>Approve</Button>
                      <Button variant="danger" onClick={() => reject(p.id)}>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
    </div>
  );
}
