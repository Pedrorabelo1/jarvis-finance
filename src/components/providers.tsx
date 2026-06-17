'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useFinanceStore } from '@/store/useFinanceStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useFinanceStore((s) => s.theme);
  const setTheme = useFinanceStore((s) => s.setTheme);

  // Always light — remove any stale dark class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(15,23,42,0.10)',
          },
        }}
      />
    </>
  );
}
