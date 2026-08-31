'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactElement } from 'react';

interface SidebarItemProps {
  href: string;
  icon: ReactElement;
  label: string;
  onClick?: () => void;
}

export default function SidebarItem({ href, icon, label, onClick }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-white/20 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}