'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Prediction } from '@/lib/types';
import { AsyncState, Badge, Button, PageHeader } from '@/components/ui';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Prediction[]>([]);
  const [published, setPublished] = useState<Prediction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'drafts' | 'published'>('drafts');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [draftRes, pubRes] = await Promise.all([
        api<{ data: Prediction[] }>('/predictions?publish_status=draft'),
        api<{ data: Prediction[] }>('/predictions?publish_status=published'),
      ]);
      setDrafts(draftRes.data.filter((p) => !p.is_automated_signal));
      setPublished(pubRes.data.filter((p) => !p.is_automated_signal));
    } catch (err) {
      setDrafts([]);
      setPublished([]);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const publish = async (id: number) => {
    await api(`/predictions/${id}/publish`, { method: 'POST' });
    load();
  };

  const archive = async (id: number) => {
    await api(`/predictions/${id}/archive`, { method: 'POST' });
    load();
  };

  const rows = tab === 'drafts' ? drafts : published;

  return (
    <div>
      <PageHeader title="Predictions" subtitle="Drafts and published manual predictions" />

      <div className="mb-4 flex gap-2">
        <Button variant={tab === 'drafts' ? 'primary' : 'secondary'} onClick={() => setTab('drafts')}>
          Drafts ({drafts.length})
        </Button>
        <Button
          variant={tab === 'published' ? 'primary' : 'secondary'}
          onClick={() => setTab('published')}
        >
          Published ({published.length})
        </Button>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyMessage={`No ${tab} predictions`}
        onRetry={load}
      >
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Pick</th>
              <th className="px-4 py-3">Odds</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3 text-white">
                    {p.home_team} vs {p.away_team}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{p.type}</td>
                  <td className="px-4 py-3">{p.predicted_value}</td>
                  <td className="px-4 py-3">{p.odds ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.publish_status === 'published' ? 'success' : 'warning'}>
                      {p.publish_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {p.publish_status === 'draft' && (
                        <Button variant="ghost" onClick={() => publish(p.id)}>
                          Publish
                        </Button>
                      )}
                      <Button variant="danger" onClick={() => archive(p.id)}>
                        Archive
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
