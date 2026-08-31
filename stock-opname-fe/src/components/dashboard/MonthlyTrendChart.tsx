'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StatBreakdown } from '@/types';

interface MonthlyTrendChartProps {
  data: StatBreakdown[];
  pageSize?: number;
}

// Grafik batang vertikal buat tren jumlah Berita Acara per bulan — murni
// CSS, tanpa library chart. Dipaginasi 6 bulan per halaman (mis. data 12
// bulan -> halaman 1 = bulan 1-6, halaman 2 = bulan 7-12).
export default function MonthlyTrendChart({ data, pageSize = 6 }: MonthlyTrendChartProps) {
  const [page, setPage] = useState(0);

  const max = Math.max(...data.map((d) => d.count), 1);
  const totalPages = Math.max(Math.ceil(data.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages - 1);
  const pageData = data.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div>
      <div className="flex items-end justify-between gap-3 h-64">
        {pageData.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-sm font-semibold text-kai-black">{d.count}</span>
            <div className="w-full flex items-end" style={{ height: '190px' }}>
              <div
                className="w-full rounded-t-md bg-kai-navy/80 transition-all duration-300"
                style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-xs text-kai-gray-500 text-center leading-tight">{d.label}</span>
          </div>
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