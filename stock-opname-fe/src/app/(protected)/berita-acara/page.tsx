'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Eye, Pencil, FileText, FileDown, Printer, Trash2, RefreshCw, Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import { downloadDocument, printDocument, generateDocument } from '@/lib/download';
import { BeritaAcara, PaginatedResponse } from '@/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ListBeritaAcaraPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [data, setData] = useState<BeritaAcara[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [deleteTarget, setDeleteTarget] = useState<BeritaAcara | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const fetchData = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 10 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const res = await api.get<PaginatedResponse<BeritaAcara>>('/berita-acara', { params });
        setData(res.data.data);
        setMeta(res.data.meta);
      } catch (err) {
        console.error('Failed to load berita acara', err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, startDate, endDate],
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/berita-acara/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData(meta.page);
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerate = async (id: number) => {
    setGeneratingId(id);
    try {
      await generateDocument(id);
      fetchData(meta.page);
    } catch (err) {
      console.error('Failed to generate', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-kai-black">Berita Acara Stock Opname</h1>
        <Button onClick={() => router.push('/berita-acara/create')}>
          <Plus className="w-4 h-4" /> Buat Baru
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari No Ref, Business Area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="sm:w-44"
          placeholder="Dari tanggal"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="sm:w-44"
          placeholder="Sampai tanggal"
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Memuat data..." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-kai-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-kai-navy text-white">
                  <th className="px-4 py-3 text-left font-semibold">No Ref</th>
                  <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold">Business Area</th>
                  <th className="px-4 py-3 text-left font-semibold">Unit Kerja</th>
                  <th className="px-4 py-3 text-left font-semibold">Aset</th>
                  <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-kai-gray-500">
                      Tidak ada data ditemukan.
                    </td>
                  </tr>
                ) : (
                  data.map((ba) => {
                    const hasDoc = ba.docxPath || ba.pdfPath;
                    const isGenerating = generatingId === ba.id;

                    return (
                      <tr
                        key={ba.id}
                        className="border-t border-kai-gray-200 even:bg-kai-gray-50 hover:bg-kai-gray-100 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-kai-blue whitespace-nowrap">
                          {ba.noRef}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(ba.tanggal)}</td>
                        <td className="px-4 py-3">{ba.businessArea}</td>
                        <td className="px-4 py-3">{ba.unitKerja}</td>
                        <td className="px-4 py-3">
                          {ba._count?.asetRows ?? ba.asetRows?.length ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <IconBtn
                              title="Lihat Detail"
                              onClick={() => router.push(`/berita-acara/${ba.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </IconBtn>
                            <IconBtn
                              title="Edit"
                              onClick={() => router.push(`/berita-acara/${ba.id}/edit`)}
                            >
                              <Pencil className="w-4 h-4" />
                            </IconBtn>

                            {hasDoc ? (
                              <>
                                {ba.docxPath && (
                                  <IconBtn
                                    title="Download DOCX"
                                    onClick={() => downloadDocument(ba.id, 'docx')}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </IconBtn>
                                )}
                                {ba.pdfPath && (
                                  <>
                                    <IconBtn
                                      title="Download PDF"
                                      onClick={() => downloadDocument(ba.id, 'pdf')}
                                    >
                                      <FileDown className="w-4 h-4" />
                                    </IconBtn>
                                    <IconBtn
                                      title="Print"
                                      onClick={() => printDocument(ba.id)}
                                    >
                                      <Printer className="w-4 h-4" />
                                    </IconBtn>
                                  </>
                                )}
                              </>
                            ) : (
                              <IconBtn
                                title="Generate Dokumen"
                                onClick={() => handleGenerate(ba.id)}
                                disabled={isGenerating}
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </IconBtn>
                            )}

                            {isAdmin && (
                              <IconBtn
                                title="Hapus"
                                onClick={() => setDeleteTarget(ba)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </IconBtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {meta.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-kai-gray-500">
                Menampilkan {from}–{to} dari {meta.total}
              </p>
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(p) => fetchData(p)}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-kai-gray-700">
          Yakin ingin menghapus Berita Acara{' '}
          <span className="font-semibold">{deleteTarget?.noRef}</span>? Tindakan ini tidak bisa
          dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  className = '',
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`p-1.5 rounded-md text-kai-gray-500 hover:bg-kai-gray-100 transition-colors disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}