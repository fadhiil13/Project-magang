'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BeritaAcaraForm from '@/components/form/BeritaAcaraForm';
import { usePageTitle } from '@/lib/pageTitle';

export default function CreateBeritaAcaraPage() {
  const router = useRouter();
  usePageTitle('Buat Berita Acara Baru');

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/berita-acara')}
        className="text-kai-blue hover:underline inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
      </button>

      <BeritaAcaraForm mode="create" />
    </div>
  );
}