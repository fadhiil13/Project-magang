'use client';

import Image from 'next/image';
import { LayoutDashboard, FileText, Search, Users, X, LogOut } from 'lucide-react';
import SidebarItem from './SidebarItem';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  desktopOpen?: boolean;
}

export default function Sidebar({ open = false, onClose = () => {}, desktopOpen = true }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();

  const nav = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center overflow-hidden flex-shrink-0 relative">
            <Image
              src="/kai-logo.jpg"
              alt="Logo KAI"
              fill
              sizes="36px"
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

      {/* Footer — user info & logout */}
      <div className="px-3 py-3 border-t border-white/10 space-y-2">
        {user && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.nama}</p>
              <Badge variant={user.role === 'ADMIN' ? 'admin' : 'user'}>{user.role}</Badge>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <p className="text-white/40 text-xs px-2">&copy; 2026 PT KAI</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — bisa di-collapse via toggle di Topbar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 bg-kai-navy z-40 overflow-hidden transition-all duration-200 ${
          desktopOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className="w-64 h-full">{nav}</div>
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