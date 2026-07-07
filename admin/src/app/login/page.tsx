'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@predictpro.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/80 p-8"
      >
        <h1 className="text-2xl font-bold text-[#6A0DAD]">Predict Pro</h1>
        <p className="mt-1 text-sm text-zinc-400">Admin sign in</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </div>
  );
}
