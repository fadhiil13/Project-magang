'use client';

import Image from 'next/image';
import { LayoutDashboard, FileText, Search, Users, X } from 'lucide-react';
import SidebarItem from './SidebarItem';
import { useAuth } from '@/lib/auth';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose = () => {} }: SidebarProps) {
  const { isAdmin } = useAuth();

  const nav = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image
              src="/kai-logo.jpg"
              alt="Logo KAI"
              width={36}
              height={36}
              style={{ width: '36px', height: 'auto' }}
              className="object-contain"
            />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight tracking-wide">
              KAi
            </div>
            <div className="text-white/50 text-[10px] leading-tight">Stock Opname TI</div>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 space-y-1">
        <SidebarItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" onClick={onClose} />
        <SidebarItem href="/berita-acara" icon={<FileText className="w-5 h-5" />} label="Berita Acara" onClick={onClose} />
        <SidebarItem href="/aset/search" icon={<Search className="w-5 h-5" />} label="Cari Aset" onClick={onClose} />
        {isAdmin && (
          <SidebarItem href="/admin/users" icon={<Users className="w-5 h-5" />} label="Kelola User" onClick={onClose} />
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/40 text-xs">&copy; 2024 PT KAI</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-kai-navy z-40">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-kai-navy shadow-xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}