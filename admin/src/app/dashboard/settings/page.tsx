'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, downloadCsv } from '@/lib/api';
import type { AdminSettings } from '@/lib/types';
import { Button, Input, PageHeader } from '@/components/ui';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState('');
  const [exportType, setExportType] = useState('');
  const [exportLeague, setExportLeague] = useState('');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api<{ data: AdminSettings }>('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleNotifications = async () => {
    if (!settings) return;
    try {
      const res = await api<{ data: AdminSettings }>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ notificationsEnabled: !settings.notificationsEnabled }),
      });
      setSettings(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const exportPredictions = async () => {
    const params = new URLSearchParams();
    if (exportType) params.set('type', exportType);
    if (exportLeague) params.set('league', exportLeague);
    if (exportFrom) params.set('from', exportFrom);
    if (exportTo) params.set('to', exportTo);
    try {
      await downloadCsv(`/admin/export/predictions?${params}`, 'predictions.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const exportSignals = async () => {
    const params = new URLSearchParams();
    if (exportLeague) params.set('league', exportLeague);
    try {
      await downloadCsv(`/admin/export/signal-history?${params}`, 'signal-history.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="API health, notifications, and data export" />
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {settings && (
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-medium text-white">API Health</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-400">API-Football configured</dt>
                <dd className={settings.apiHealth.apiFootballConfigured ? 'text-green-400' : 'text-amber-400'}>
                  {settings.apiHealth.apiFootballConfigured ? 'Yes' : 'No (demo mode)'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">API requests (session)</dt>
                <dd className="text-white">{settings.apiHealth.apiUsage.requestCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">Last API call</dt>
                <dd className="text-white">
                  {settings.apiHealth.apiUsage.lastRequestAt
                    ? new Date(settings.apiHealth.apiUsage.lastRequestAt).toLocaleString()
                    : 'Never'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-medium text-white">Push notifications</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Dispatch FCM pushes when signals are approved (Section 4 wires FCM)
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-zinc-300">
                Notifications {settings.notificationsEnabled ? 'enabled' : 'disabled'}
              </span>
              <Button variant="secondary" onClick={toggleNotifications}>
                Toggle
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-medium text-white">Data export (CSV)</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input placeholder="Type (optional)" value={exportType} onChange={(e) => setExportType(e.target.value)} />
              <Input placeholder="League (optional)" value={exportLeague} onChange={(e) => setExportLeague(e.target.value)} />
              <Input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
              <Input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={exportPredictions}>
                Export predictions
              </Button>
              <Button variant="secondary" onClick={exportSignals}>
                Export signal history
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
