'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Match, Prediction } from '@/lib/types';
import {
  Badge,
  Button,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';

type PredictionForm = {
  type: string;
  predicted_value: string;
  odds: string;
  confidence_score: string;
  notes: string;
};

const emptyForm: PredictionForm = {
  type: '1X2',
  predicted_value: '1',
  odds: '',
  confidence_score: '',
  notes: '',
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [date, setDate] = useState('');
  const [league, setLeague] = useState('');
  const [market, setMarket] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [form, setForm] = useState<PredictionForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (league) params.set('league', league);
      if (market) params.set('market', market);
      if (search) params.set('search', search);
      const res = await api<{ data: Match[] }>(`/matches?${params}`);
      setMatches(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [date, league, market, search]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const togglePublish = async (match: Match) => {
    try {
      await api(`/matches/${match.id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ published: !match.published }),
      });
      loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const openModal = (match: Match) => {
    setSelectedMatch(match);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const submitPrediction = async (publishStatus: 'draft' | 'published') => {
    if (!selectedMatch) return;
    setSaving(true);
    setError('');
    try {
      await api<{ data: Prediction }>('/predictions', {
        method: 'POST',
        body: JSON.stringify({
          match_id: selectedMatch.id,
          type: form.type,
          predicted_value: form.predicted_value,
          odds: form.odds ? Number(form.odds) : null,
          confidence_score: form.confidence_score ? Number(form.confidence_score) : null,
          notes: form.notes || null,
          publish_status: publishStatus,
        }),
      });
      setModalOpen(false);
      loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const seedDemo = async () => {
    try {
      await api('/matches/demo', { method: 'POST' });
      loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo seed failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Matches"
        subtitle="Upcoming and active fixtures — click “+ Add Prediction” on any match to publish a tip"
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        <Input placeholder="League" value={league} onChange={(e) => setLeague(e.target.value)} className="w-40" />
        <Input placeholder="Market" value={market} onChange={(e) => setMarket(e.target.value)} className="w-40" />
        <Input placeholder="Search teams…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
        <Button variant="secondary" onClick={loadMatches}>
          Apply
        </Button>
        <Button variant="ghost" onClick={seedDemo}>
          + Demo match
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">League</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No matches found
                </td>
              </tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40">
                  <td className="px-4 py-3 text-white">
                    {m.home_team} vs {m.away_team}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{m.league}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(m.match_datetime).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {m.home_score ?? 0} – {m.away_score ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{m.match_status ?? 'NS'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={m.published ? 'success' : 'default'}>
                      {m.published ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button onClick={() => openModal(m)}>
                        + Add Prediction
                      </Button>
                      <Button variant="secondary" onClick={() => togglePublish(m)}>
                        {m.published ? 'Unpublish' : 'Publish'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title="Add Prediction" onClose={() => setModalOpen(false)}>
        {selectedMatch && (
          <p className="mb-4 text-sm text-zinc-400">
            {selectedMatch.home_team} vs {selectedMatch.away_team}
          </p>
        )}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Prediction type</label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="1X2">1X2</option>
              <option value="DoubleChance">Double Chance</option>
              <option value="UnderOver">Under/Over 2.5</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Predicted value</label>
            <Input
              value={form.predicted_value}
              onChange={(e) => setForm({ ...form, predicted_value: e.target.value })}
              placeholder="1, X, 2, Over 2.5…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Live / current odds</label>
            <Input
              type="number"
              step="0.01"
              value={form.odds}
              onChange={(e) => setForm({ ...form, odds: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Confidence score (%)</label>
            <Input
              type="number"
              value={form.confidence_score}
              onChange={(e) => setForm({ ...form, confidence_score: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Notes / analysis</label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" disabled={saving} onClick={() => submitPrediction('draft')}>
              Save as Draft
            </Button>
            <Button disabled={saving} onClick={() => submitPrediction('published')}>
              Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
