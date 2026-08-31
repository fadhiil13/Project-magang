export interface User {
  id: number;
  username: string;
  nama: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AsetRow {
  id?: number;
  nomorUrut?: number;
  nomorInventaris: string;
  serialNumber: string;
  jenisAset: string;
  merek: string;
  sumberData: string;
  keterangan: string;
}

export interface BeritaAcara {
  id: number;
  noRef: string;
  tanggal: string;
  businessArea: string;
  unitKerja: string;
  tempatKedudukan: string;
  analisa: string;
  tindakLanjut?: string;
  namaPimpinanUnitKerja?: string;
  jabatanPimpinanUnitKerja?: string;
  nipPimpinanUnitKerja?: string;
  ttdPimpinanUnitKerja?: string;
  namaPimpinanIT?: string;
  jabatanPimpinanIT?: string;
  nipPimpinanIT?: string;
  ttdPimpinanIT?: string;
  namaPetugas?: string;
  jabatanPetugas?: string;
  nipPetugas?: string;
  ttdPetugas?: string;
  docxPath?: string;
  pdfPath?: string;
  hasDocument?: boolean;
  dokumenStale?: boolean;
  userId: number;
  user?: User;
  asetRows: AsetRow[];
  _count?: { asetRows: number };
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StatBreakdown {
  label: string;
  count: number;
}

export interface DashboardStats {
  totalBeritaAcara: number;
  totalAset: number;
  totalBusinessArea: number;
  beritaAcaraBulanIni: number;
  asetByJenis: StatBreakdown[];
  baByUnitKerja: StatBreakdown[];
  trendBulanan: StatBreakdown[];
  dokumenSudahDigenerate: number;
  dokumenBelumDigenerate: number;
}

export interface AsetSearchResult {
  nomorInventaris: string;
  serialNumber: string;
  jenisAset: string;
  merek: string;
  latestLocation: {
    businessArea: string;
    unitKerja: string;
    tempatKedudukan: string;
    tanggal: string;
    noRef: string;
  };
  beritaAcaraCount: number;
}