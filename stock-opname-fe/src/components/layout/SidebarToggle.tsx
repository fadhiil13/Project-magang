'use client';

import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarToggleProps {
  onMenuClick: () => void;
  desktopOpen: boolean;
  onToggleDesktop: () => void;
}

// Tombol buka/tutup sidebar, floating kecil di pojok kiri atas — gantiin
// Topbar yang sebelumnya cuma berisi tombol ini doang (jadi kosong/mubazir).
// Mobile & desktop pakai tombol terpisah karena perilakunya beda: mobile
// buka drawer overlay, desktop toggle collapse sidebar yang fixed.
export default function SidebarToggle({ onMenuClick, desktopOpen, onToggleDesktop }: SidebarToggleProps) {
  return (
    <>
      {/* Mobile — buka drawer */}
      <button
        onClick={onMenuClick}
        className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-lg bg-white shadow-md border border-kai-gray-200 text-kai-gray-700 hover:bg-kai-gray-50 transition-colors"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop — toggle collapse, posisi ikut geser sesuai state sidebar */}
      <button
        onClick={onToggleDesktop}
        className={`hidden lg:flex fixed top-4 z-30 p-2.5 rounded-lg bg-white shadow-md border border-kai-gray-200 text-kai-gray-700 hover:bg-kai-gray-50 transition-all duration-200 ${
          desktopOpen ? 'left-[272px]' : 'left-4'
        }`}
        title={desktopOpen ? 'Tutup sidebar' : 'Buka sidebar'}
        aria-label={desktopOpen ? 'Tutup sidebar' : 'Buka sidebar'}
      >
        {desktopOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>
    </>
  );
}