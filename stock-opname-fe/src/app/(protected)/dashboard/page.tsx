'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Monitor, Building2, CalendarDays, ArrowRight, FileCheck2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BarList from '@/components/dashboard/BarList';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import { useAuth } from '@/lib/auth';
import { usePageTitle } from '@/lib/pageTitle';
import api from '@/lib/api';
import { DashboardStats, BeritaAcara } from '@/types';

const statConfig = [
  { key: 'totalBeritaAcara', label: 'Berita Acara', icon: ClipboardList, color: '#2D2B70' },
  { key: 'totalAset', label: 'Total Aset Tercatat', icon: Monitor, color: '#F26924' },
  { key: 'totalBusinessArea', label: 'Business Area', icon: Building2, color: '#0E5BA9' },
  { key: 'beritaAcaraBulanIni', label: 'Bulan Ini', icon: CalendarDays, color: '#198754' },
] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  usePageTitle(`Selamat datang, ${user?.nama ?? ''}!`, 'Ringkasan Stock Opname Aset TI');
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<BeritaAcara[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.get<DashboardStats>('/berita-acara/statistics'),
          api.get('/berita-acara', { params: { page: 1, limit: 5 } }),
        ]);
        setStats(statsRes.data);
        setRecent(recentRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Memuat dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statConfig.map((s) => {
          const Icon = s.icon;
          const value = stats ? stats[s.key] : 0;
          return (
            <Card key={s.key} accentColor={s.color}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-kai-black">{value}</p>
                  <p className="text-sm text-kai-gray-500 mt-1">{s.label}</p>
                </div>
                <Icon className="w-8 h-8 opacity-20" style={{ color: s.color }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Status Dokumen */}
      <Card>
        <h2 className="text-base font-semibold text-kai-black mb-4">Status Generate Dokumen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kai-black">{stats?.dokumenSudahDigenerate ?? 0}</p>
              <p className="text-xs text-kai-gray-500">Sudah digenerate</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-kai-gray-50 border border-kai-gray-200">
            <div className="w-10 h-10 rounded-full bg-kai-gray-100 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-kai-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kai-black">{stats?.dokumenBelumDigenerate ?? 0}</p>
              <p className="text-xs text-kai-gray-500">Belum digenerate</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Aset Detail & Statistik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-base font-semibold text-kai-black mb-4">Aset per Jenis</h2>
          <BarList data={stats?.asetByJenis ?? []} color="#F26924" />
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-kai-black mb-4">Berita Acara per Business Area</h2>
          <BarList data={stats?.baByBusinessArea ?? []} color="#2D2B70" />
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-kai-black mb-4">Tren Berita Acara Bulanan</h2>
          <MonthlyTrendChart data={stats?.trendBulanan ?? []} />
        </Card>
      </div>

      {/* Recent Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-kai-black">Berita Acara Terbaru</h2>
          <button
            onClick={() => router.push('/berita-acara')}
            className="text-sm text-kai-blue hover:underline inline-flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-kai-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-kai-navy text-white">
                <th className="px-4 py-3 text-left font-semibold">No Ref</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold">Business Area</th>
                <th className="px-4 py-3 text-left font-semibold">Aset</th>
                <th className="px-4 py-3 text-left font-semibold">User</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-kai-gray-500">
                    Belum ada data.
                  </td>
                </tr>
              ) : (
                recent.map((ba) => (
                  <tr
                    key={ba.id}
                    onClick={() => router.push(`/berita-acara/${ba.id}`)}
                    className="border-t border-kai-gray-200 even:bg-kai-gray-50 hover:bg-kai-gray-100 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-kai-blue">{ba.noRef}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(ba.tanggal)}</td>
                    <td className="px-4 py-3">{ba.businessArea}</td>
                    <td className="px-4 py-3">{ba._count?.asetRows ?? ba.asetRows?.length ?? 0}</td>
                    <td className="px-4 py-3">{ba.user?.nama ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}