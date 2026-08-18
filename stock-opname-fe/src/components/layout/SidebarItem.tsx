'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
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
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-r-lg ${
        isActive
          ? 'bg-white/10 border-l-4 border-kai-orange text-white font-semibold'
          : 'border-l-4 border-transparent text-white/80 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}