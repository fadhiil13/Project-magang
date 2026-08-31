'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StatBreakdown } from '@/types';

interface BarListProps {
  data: StatBreakdown[];
  color?: string;
  emptyText?: string;
  pageSize?: number;
}

// Daftar horizontal bar sederhana (tanpa library chart) — lebar tiap bar
// proporsional terhadap nilai terbesar di SELURUH data (bukan cuma yang
// tampil di halaman itu), biar perbandingan antar halaman tetap valid.
//
// Setiap halaman SELALU merender `pageSize` slot (yang kosong diisi
// placeholder tak terlihat dengan tinggi identik), supaya tinggi card
// nggak berubah-ubah antar halaman — mencegah card lain di bawahnya
// "loncat" naik/turun pas ganti halaman.
export default function BarList({
  data,
  color = '#0E5BA9',
  emptyText = 'Belum ada data',
  pageSize = 5,
}: BarListProps) {
  const [page, setPage] = useState(0);

  if (data.length === 0) {
    return <p className="text-sm text-kai-gray-500 py-6 text-center">{emptyText}</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const totalPages = Math.ceil(data.length / pageSize);
  const currentPage = Math.min(page, totalPages - 1);
  const pageData = data.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
  const placeholders = pageSize - pageData.length;

  return (
    <div>
      <div className="space-y-3">
        {pageData.map((d) => (
          <div key={d.label} className="h-[30px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-kai-gray-700 font-medium truncate pr-2">{d.label}</span>
              <span className="font-semibold text-kai-black shrink-0 tabular-nums">{d.count}</span>
            </div>
            <div className="h-2 bg-kai-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max((d.count / max) * 100, 3)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <div key={`placeholder-${i}`} className="h-[30px]" aria-hidden="true" />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-kai-gray-100">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-kai-gray-200 text-kai-gray-500 hover:bg-kai-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-kai-gray-500">
            Halaman {currentPage + 1} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-kai-gray-200 text-kai-gray-500 hover:bg-kai-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}