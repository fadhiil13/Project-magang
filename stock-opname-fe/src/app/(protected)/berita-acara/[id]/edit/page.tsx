'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BeritaAcaraForm from '@/components/form/BeritaAcaraForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { usePageTitle } from '@/lib/pageTitle';
import api from '@/lib/api';
import { BeritaAcara } from '@/types';

export default function EditBeritaAcaraPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [data, setData] = useState<BeritaAcara | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(data ? `Edit Berita Acara: ${data.noRef}` : 'Edit Berita Acara');

  useEffect(() => {
    api
      .get<BeritaAcara>(`/berita-acara/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error('Failed to load', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner message="Memuat data..." />;

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-kai-gray-500">Berita Acara tidak ditemukan.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/berita-acara')}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push(`/berita-acara/${id}`)}
        className="text-kai-blue hover:underline inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke detail
      </button>

      <BeritaAcaraForm mode="edit" initialData={data} />
    </div>
  );
}