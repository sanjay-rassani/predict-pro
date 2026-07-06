'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { NewsArticle } from '@/lib/types';
import { Badge, Button, Input, Modal, PageHeader, Select, Textarea } from '@/components/ui';

type NewsForm = {
  title: string;
  body: string;
  image_url: string;
  category: string;
  published: boolean;
};

const empty: NewsForm = {
  title: '',
  body: '',
  image_url: '',
  category: 'general',
  published: false,
};

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState<NewsForm>(empty);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api<{ data: NewsArticle[] }>('/news/admin/all');
      setArticles(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (article: NewsArticle) => {
    setEditing(article);
    setForm({
      title: article.title,
      body: article.body,
      image_url: article.image_url ?? '',
      category: article.category,
      published: article.published,
    });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        title: form.title,
        body: form.body,
        image_url: form.image_url || null,
        category: form.category,
        published: form.published,
      };
      if (editing) {
        await api(`/news/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/news', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this article?')) return;
    await api(`/news/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <PageHeader title="News" subtitle="Create and manage football news articles" />
      <div className="mb-4">
        <Button onClick={openCreate}>+ New article</Button>
      </div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No articles yet
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3 text-white">{a.title}</td>
                  <td className="px-4 py-3 capitalize text-zinc-400">{a.category}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.published ? 'success' : 'default'}>
                      {a.published ? 'Live' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(a)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => remove(a.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit article' : 'New article'}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">General</option>
            <option value="injury">Injury</option>
            <option value="transfer">Transfer</option>
            <option value="lineup">Lineup</option>
          </Select>
          <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <Textarea rows={6} placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published (visible in app)
          </label>
          <Button onClick={save} className="w-full">
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
