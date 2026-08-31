'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth';
import { PageTitleProvider } from '@/lib/pageTitle';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kai-gray-50">
        <LoadingSpinner message="Memuat..." />
      </div>
    );
  }

  return (
    <PageTitleProvider>
      <div className="min-h-screen bg-kai-gray-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} desktopOpen={desktopSidebarOpen} />
        <div className={`transition-all duration-200 ${desktopSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <Topbar
            onMenuClick={() => setSidebarOpen(true)}
            desktopOpen={desktopSidebarOpen}
            onToggleDesktop={() => setDesktopSidebarOpen((v) => !v)}
          />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </PageTitleProvider>
  );
}