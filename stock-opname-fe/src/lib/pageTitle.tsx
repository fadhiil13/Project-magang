'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PageTitleValue {
  title: string;
  subtitle?: string;
}

interface PageTitleContextType {
  value: PageTitleValue | null;
  setValue: (v: PageTitleValue | null) => void;
}

const PageTitleContext = createContext<PageTitleContextType | null>(null);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<PageTitleValue | null>(null);
  return (
    <PageTitleContext.Provider value={{ value, setValue }}>{children}</PageTitleContext.Provider>
  );
}

/** Dipakai oleh layout (Topbar) buat baca judul halaman yang lagi aktif. */
export function usePageTitleValue() {
  const ctx = useContext(PageTitleContext);
  if (!ctx) throw new Error('usePageTitleValue must be used within PageTitleProvider');
  return ctx.value;
}

/**
 * Dipakai oleh tiap halaman buat "kirim" judulnya ke Topbar bersama.
 * Otomatis kebersih pas halaman itu di-unmount (pindah halaman lain).
 */
export function usePageTitle(title: string, subtitle?: string) {
  const ctx = useContext(PageTitleContext);
  if (!ctx) throw new Error('usePageTitle must be used within PageTitleProvider');
  const { setValue } = ctx;

  useEffect(() => {
    setValue({ title, subtitle });
    return () => setValue(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle]);
}