'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useFinanceStore } from '@/store/useFinanceStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useFinanceStore((s) => s.theme);
  const setTheme = useFinanceStore((s) => s.setTheme);

  // Hydrate theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('jarvis-theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, [setTheme]);

  // Sync theme to <html> and persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('jarvis-theme', theme);
  }, [theme]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#f1f5f9',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          },
        }}
      />
    </>
  );
}
