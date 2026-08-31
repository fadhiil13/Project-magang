'use client';

import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePageTitleValue } from '@/lib/pageTitle';

interface TopbarProps {
  onMenuClick: () => void;
  desktopOpen: boolean;
  onToggleDesktop: () => void;
}

// Topbar tipis — isinya tombol toggle sidebar + judul halaman yang lagi
// aktif (dikirim tiap halaman lewat usePageTitle()). Jadi tetap "kerasa"
// ada header, nggak cuma tombol ngambang doang.
export default function Topbar({ onMenuClick, desktopOpen, onToggleDesktop }: TopbarProps) {
  const page = usePageTitleValue();

  return (
    <header className="bg-white border-b border-kai-gray-200 px-4 lg:px-6 py-3 flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-kai-gray-700 hover:bg-kai-gray-100 transition-colors shrink-0"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <button
        onClick={onToggleDesktop}
        className="hidden lg:flex p-2 rounded-lg text-kai-gray-700 hover:bg-kai-gray-100 transition-colors shrink-0"
        title={desktopOpen ? 'Tutup sidebar' : 'Buka sidebar'}
        aria-label={desktopOpen ? 'Tutup sidebar' : 'Buka sidebar'}
      >
        {desktopOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>

      {page && (
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-kai-black truncate">{page.title}</h1>
          {page.subtitle && <p className="text-xs text-kai-gray-500 truncate">{page.subtitle}</p>}
        </div>
      )}
    </header>
  );
}