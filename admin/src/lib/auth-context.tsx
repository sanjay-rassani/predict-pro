'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, clearToken, getToken, setToken } from './api';
import type { LoginResponse } from './types';

type AuthContextValue = {
  email: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('admin_email');
    if (getToken() && stored) setEmail(stored);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const isLogin = pathname === '/login';
    if (!getToken() && !isLogin) router.replace('/login');
    if (getToken() && isLogin) router.replace('/dashboard');
  }, [isReady, pathname, router]);

  const login = async (loginEmail: string, password: string) => {
    const res = await api<LoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password }),
    });
    setToken(res.token);
    localStorage.setItem('admin_email', res.admin.email);
    setEmail(res.admin.email);
    router.push('/dashboard');
  };

  const logout = () => {
    clearToken();
    setEmail(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ email, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
