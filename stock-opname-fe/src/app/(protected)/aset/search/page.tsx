'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Monitor, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import { AsetSearchResult } from '@/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AsetSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AsetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setResults([]);
      if (!debouncedQuery) setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    api
      .get('/aset/search', { params: { q: debouncedQuery } })
      .then((res) => setResults(res.data?.data || res.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-kai-black">Cari Aset Teknologi Informasi</h1>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kai-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari Nomor Inventaris atau Serial Number..."
          className="w-full text-lg pl-12 pr-4 py-4 rounded-xl border-2 border-kai-gray-200 focus:border-kai-blue focus:outline-none focus:ring-2 focus:ring-kai-blue/20 transition-colors bg-white"
        />
      </div>

      {/* Loading */}
      {loading && <LoadingSpinner message="Mencari aset..." />}

      {/* Results */}
      {!loading && searched && results.length === 0 && (
        <EmptyState
          icon={<Search className="w-12 h-12 mx-auto" />}
          title="Aset tidak ditemukan"
          description="Pastikan nomor inventaris atau serial number benar."
        />
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-kai-gray-500">
          <Monitor className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Masukkan nomor inventaris atau serial number untuk mencari aset</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-kai-gray-500">
            {results.length} aset ditemukan
          </p>
          <div className="space-y-4">
            {results.map((aset, idx) => (
              <AsetCard key={`${aset.nomorInventaris}-${idx}`} aset={aset} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AsetCard({ aset }: { aset: AsetSearchResult }) {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    if (history.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await api.get(`/aset/${encodeURIComponent(aset.nomorInventaris)}/history`);
        setHistory(res.data?.data || res.data || []);
      } catch {
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }
    setShowHistory(true);
  };

  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-kai-navy" />
          <span className="text-lg font-bold text-kai-navy font-mono">{aset.nomorInventaris}</span>
        </div>
        <Badge variant="user">Tercatat di {aset.beritaAcaraCount} BA</Badge>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-4">
        <div>
          <span className="text-kai-gray-500">Serial: </span>
          <span className="font-mono text-xs">{aset.serialNumber}</span>
        </div>
        <div>
          <span className="text-kai-gray-500">Jenis: </span>
          <span>{aset.jenisAset}</span>
        </div>
        <div>
          <span className="text-kai-gray-500">Merek: </span>
          <span>{aset.merek}</span>
        </div>
      </div>

      {/* Lokasi terkini */}
      {aset.latestLocation && (
        <div className="bg-kai-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-1 text-sm font-semibold text-kai-black mb-1">
            <MapPin className="w-4 h-4 text-kai-blue" /> Lokasi Terkini
          </div>
          <p className="text-sm text-kai-gray-700">
            {aset.latestLocation.businessArea} — {aset.latestLocation.unitKerja} — {aset.latestLocation.tempatKedudukan}
          </p>
          <p className="text-xs text-kai-gray-500 mt-1">
            Terakhir dicatat: {formatDate(aset.latestLocation.tanggal)} (BA: {aset.latestLocation.noRef})
          </p>
        </div>
      )}

      {/* History toggle */}
      <button
        type="button"
        onClick={toggleHistory}
        className="text-sm text-kai-blue hover:underline inline-flex items-center gap-1"
      >
        📋 Lihat Histori Lengkap
        {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* History table */}
      {showHistory && (
        <div className="mt-3">
          {loadingHistory ? (
            <LoadingSpinner message="Memuat histori..." />
          ) : history.length === 0 ? (
            <p className="text-sm text-kai-gray-500 py-2">Belum ada histori.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-kai-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-kai-navy/10 text-kai-navy">
                    <th className="px-3 py-2 text-left font-semibold">#</th>
                    <th className="px-3 py-2 text-left font-semibold">No Ref</th>
                    <th className="px-3 py-2 text-left font-semibold">Tanggal</th>
                    <th className="px-3 py-2 text-left font-semibold">Business Area</th>
                    <th className="px-3 py-2 text-left font-semibold">Unit Kerja</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-t border-kai-gray-200 even:bg-kai-gray-50 hover:bg-kai-gray-100 cursor-pointer"
                      onClick={() => h.beritaAcaraId && router.push(`/berita-acara/${h.beritaAcaraId}`)}
                    >
                      <td className="px-3 py-2 text-kai-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-kai-blue">{h.noRef}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateShort(h.tanggal)}</td>
                      <td className="px-3 py-2">{h.businessArea}</td>
                      <td className="px-3 py-2">{h.unitKerja}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}