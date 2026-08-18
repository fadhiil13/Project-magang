import { z } from 'zod';

export const asetRowSchema = z.object({
  nomorInventaris: z.string().min(1, 'Nomor inventaris wajib diisi'),
  serialNumber: z.string().min(1, 'Serial number wajib diisi'),
  jenisAset: z.string().min(1, 'Jenis aset wajib dipilih'),
  merek: z.string().min(1, 'Merek wajib diisi'),
  sumberData: z.string().min(1, 'Sumber data wajib diisi'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi'),
});

export const beritaAcaraSchema = z.object({
  // Step 1: Data Umum
  noRef: z.string().min(1, 'No. Ref wajib diisi'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  businessArea: z.string().min(1, 'Business Area wajib diisi'),
  unitKerja: z.string().min(1, 'Unit Kerja wajib diisi'),
  tempatKedudukan: z.string().min(1, 'Tempat Kedudukan wajib diisi'),

  // Step 2: Analisa + Aset
  analisa: z.string().min(1, 'Analisa wajib diisi'),
  tindakLanjut: z.string().optional(),
  asetRows: z.array(asetRowSchema).min(1, 'Minimal 1 baris aset'),

  // Step 3: Tanda Tangan
  namaPimpinanUnitKerja: z.string().optional(),
  jabatanPimpinanUnitKerja: z.string().optional(),
  nipPimpinanUnitKerja: z.string().optional(),
  ttdPimpinanUnitKerja: z.string().optional(),
  namaPimpinanIT: z.string().optional(),
  ttdPimpinanIT: z.string().optional(),
});

export type BeritaAcaraFormData = z.infer<typeof beritaAcaraSchema>;

// Field yang divalidasi per step
export const step1Fields = ['noRef', 'tanggal', 'businessArea', 'unitKerja', 'tempatKedudukan'] as const;
export const step2Fields = ['analisa', 'asetRows'] as const;