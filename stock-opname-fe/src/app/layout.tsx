import type { Metadata } from 'next';
import '@/app/globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Stock Opname Aset TI — PT KAI',
  description: 'Sistem Berita Acara Stock Opname Aset TI PT Kereta Api Indonesia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}