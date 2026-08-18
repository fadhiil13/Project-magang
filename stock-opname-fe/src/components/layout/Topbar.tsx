'use client';

import { Menu, LogOut } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-kai-gray-700 hover:bg-kai-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-kai-black">{user.nama}</p>
              <Badge variant={user.role === 'ADMIN' ? 'admin' : 'user'}>{user.role}</Badge>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-kai-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}