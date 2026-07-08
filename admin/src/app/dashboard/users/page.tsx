'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AppUser } from '@/lib/types';
import { AsyncState, Badge, Button, Input, Modal, PageHeader, Select } from '@/components/ui';

type UserForm = {
  email: string;
  role: 'free' | 'premium';
  password: string;
};

const empty: UserForm = {
  email: '',
  role: 'free',
  password: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UserForm>(empty);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ data: AppUser[] }>('/users');
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user: AppUser) => {
    setEditing(user);
    setForm({ email: user.email, role: user.role, password: '' });
    setFormError('');
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (!editing && form.password.trim().length < 6) {
        setFormError('Password must be at least 6 characters');
        setSaving(false);
        return;
      }
      if (editing) {
        const payload: Record<string, unknown> = { email: form.email.trim(), role: form.role };
        if (form.password.trim()) payload.password = form.password.trim();
        await api(`/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        const payload = {
          email: form.email.trim(),
          role: form.role,
          password: form.password.trim(),
        };
        await api('/users', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (user: AppUser) => {
    if (!confirm(`Delete ${user.email}?`)) return;
    try {
      await api(`/users/${user.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader title="Users" subtitle="Create and manage app users and their access tier" />
      <div className="mb-4">
        <Button onClick={openCreate}>+ New user</Button>
      </div>
      {error && !loading && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <AsyncState
        loading={loading}
        error={loading ? '' : error}
        empty={users.length === 0}
        emptyMessage="No users yet"
        onRetry={load}
      >
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3 text-white">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.role === 'premium' ? 'purple' : 'default'}>
                      {u.role === 'premium' ? 'Premium' : 'Free'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => remove(u)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit user' : 'New user'}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserForm['role'] })}
          >
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </Select>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={editing ? 'New password (leave blank to keep)' : 'Password (min 6 characters)'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
