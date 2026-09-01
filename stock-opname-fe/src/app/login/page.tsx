'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-kai-navy to-kai-blue px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-3 relative w-[140px] h-[70px]">
              <Image
                src="/kai-logo.jpg"
                alt="Logo PT KAI"
                fill
                sizes="140px"
                className="object-contain"
                priority
              />
            </div>
            <p className="text-kai-gray-500 text-sm">Sistem Stock Opname Aset TI</p>
          </div>

          <LoginForm />
        </div>

        <p className="text-center text-white/40 text-xs mt-6">&copy; 2026 PT Kereta Api Indonesia</p>
      </div>
    </div>
  );
}