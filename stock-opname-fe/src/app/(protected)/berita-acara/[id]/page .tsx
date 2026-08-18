'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, FileText, FileDown, Printer, Trash2, RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { downloadDocument, printDocument, generateDocument } from '@/lib/download';
import { BeritaAcara } from '@/types';

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DetailBeritaAcaraPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const id = Number(params.id);

  const [ba, setBa] = useState<BeritaAcara | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get<BeritaAcara>(`/berita-acara/${id}`);
      setBa(res.data);
    } catch (err) {
      console.error('Failed to load detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/berita-acara/${id}`);
      router.push('/berita-acara');
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateDocument(id);
      await fetchDetail();
    } catch (err) {
      console.error('Failed to generate', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Memuat detail..." />;
  if (!ba) {
    return (
      <div className="text-center py-16">
        <p className="text-kai-gray-500">Berita Acara tidak ditemukan.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/berita-acara')}>
          Kembali
        </Button>
      </div>
    );
  }

  const hasDoc = ba.docxPath || ba.pdfPath;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/berita-acara')}
        className="text-kai-blue hover:underline inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
      </button>

      {/* Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-kai-black">Berita Acara: {ba.noRef}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push(`/berita-acara/${id}/edit`)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>

          {hasDoc ? (
            <>
              {ba.docxPath && (
                <Button variant="secondary" size="sm" onClick={() => downloadDocument(id, 'docx')}>
                  <FileText className="w-4 h-4" /> DOCX
                </Button>
              )}
              {ba.pdfPath && (
                <>
                  <Button size="sm" onClick={() => downloadDocument(id, 'pdf')}>
                    <FileDown className="w-4 h-4" /> PDF
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => printDocument(id)}>
                    <Printer className="w-4 h-4" /> Print
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button size="sm" loading={generating} onClick={handleGenerate}>
              <RefreshCw className="w-4 h-4" /> Generate Dokumen
            </Button>
          )}

          {isAdmin && (
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="w-4 h-4" /> Hapus
            </Button>
          )}
        </div>
      </div>

      {/* Data Umum */}
      <Card>
        <h2 className="text-base font-semibold text-kai-black mb-4">Data Umum</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <Field label="No. Ref" value={ba.noRef} />
          <Field label="Tanggal" value={formatDateLong(ba.tanggal)} />
          <Field label="Business Area" value={ba.businessArea} />
          <Field label="Unit Kerja" value={ba.unitKerja} />
          <Field label="Tempat Kedudukan" value={ba.tempatKedudukan} />
          <Field label="Dibuat oleh" value={`${ba.user?.nama ?? '-'} (${ba.user?.username ?? '-'})`} />
        </div>
      </Card>

      {/* Analisa & Tindak Lanjut */}
      <Card>
        <h2 className="text-base font-semibold text-kai-black mb-4">Analisa & Tindak Lanjut</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-kai-gray-500 mb-1">Analisa</p>
            <p className="text-kai-black whitespace-pre-wrap">{ba.analisa || '-'}</p>
          </div>
          <div>
            <p className="text-kai-gray-500 mb-1">Tindak Lanjut</p>
            <p className="text-kai-black whitespace-pre-wrap">{ba.tindakLanjut || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Data Aset */}
      <Card>
        <h2 className="text-base font-semibold text-kai-black mb-4">
          Data Aset ({ba.asetRows?.length ?? 0} item)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-kai-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-kai-navy text-white">
                <th className="px-3 py-2.5 text-left font-semibold w-12">No</th>
                <th className="px-3 py-2.5 text-left font-semibold">No Inventaris</th>
                <th className="px-3 py-2.5 text-left font-semibold">Serial Number</th>
                <th className="px-3 py-2.5 text-left font-semibold">Jenis</th>
                <th className="px-3 py-2.5 text-left font-semibold">Merek</th>
                <th className="px-3 py-2.5 text-left font-semibold">Sumber Data</th>
                <th className="px-3 py-2.5 text-left font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {(!ba.asetRows || ba.asetRows.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-kai-gray-500">
                    Tidak ada data aset.
                  </td>
                </tr>
              ) : (
                ba.asetRows.map((row, idx) => (
                  <tr
                    key={row.id ?? idx}
                    className="border-t border-kai-gray-200 even:bg-kai-gray-50"
                  >
                    <td className="px-3 py-2.5 text-kai-gray-500">{row.nomorUrut ?? idx + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.nomorInventaris}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.serialNumber}</td>
                    <td className="px-3 py-2.5">{row.jenisAset}</td>
                    <td className="px-3 py-2.5">{row.merek}</td>
                    <td className="px-3 py-2.5">{row.sumberData}</td>
                    <td className="px-3 py-2.5">{row.keterangan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tanda Tangan */}
      <Card>
        <h2 className="text-base font-semibold text-kai-black mb-4">Tanda Tangan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SignatureBlock
            title="Pimpinan Unit Kerja"
            subtitle={ba.jabatanPimpinanUnitKerja}
            nama={ba.namaPimpinanUnitKerja}
            nip={ba.nipPimpinanUnitKerja}
            ttd={ba.ttdPimpinanUnitKerja}
          />
          <SignatureBlock
            title="Pimpinan IT"
            subtitle="Pengelola Aset TI"
            nama={ba.namaPimpinanIT}
            ttd={ba.ttdPimpinanIT}
          />
        </div>
      </Card>

      {/* Delete Modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Batal
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-kai-gray-700">
          Yakin ingin menghapus Berita Acara <span className="font-semibold">{ba.noRef}</span>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-kai-gray-500">{label}</p>
      <p className="text-kai-black font-medium">{value}</p>
    </div>
  );
}

function SignatureBlock({
  title,
  subtitle,
  nama,
  nip,
  ttd,
}: {
  title: string;
  subtitle?: string;
  nama?: string;
  nip?: string;
  ttd?: string;
}) {
  return (
    <div className="text-center border border-kai-gray-200 rounded-lg p-4">
      <p className="text-sm font-semibold text-kai-black">{title}</p>
      {subtitle && <p className="text-xs text-kai-gray-500">{subtitle}</p>}
      <div className="h-24 flex items-center justify-center my-3">
        {ttd ? (
          <img src={ttd} alt={`Tanda tangan ${title}`} className="max-h-20 object-contain" />
        ) : (
          <div className="w-40 border-b border-kai-gray-200" />
        )}
      </div>
      <p className="text-sm font-medium text-kai-black">
        {nama ? `(${nama})` : '(________________)'}
      </p>
      {nip && <p className="text-xs text-kai-gray-500">{nip}</p>}
    </div>
  );
}