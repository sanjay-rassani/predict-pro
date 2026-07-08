'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/matches', label: 'Matches' },
  { href: '/dashboard/drafts', label: 'Drafts' },
  { href: '/dashboard/approval', label: 'Approval Queue' },
  { href: '/dashboard/news', label: 'News' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { email, logout, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 p-5">
          <p className="text-lg font-bold text-[#6A0DAD]">Predict Pro</p>
          <p className="text-xs text-zinc-500">Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? 'bg-[#6A0DAD]/20 font-medium text-purple-200'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 p-4">
          <p className="truncate text-xs text-zinc-500">{email}</p>
          <button
            onClick={logout}
            className="mt-2 text-sm text-zinc-400 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
