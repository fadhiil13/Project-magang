export const JENIS_ASET_OPTIONS = [
  'PC Desktop',
  'Notebook',
  'PC All In One',
  'Printer',
  'Monitor',
  'Server',
  'Scanner',
  'UPS',
  'Lainnya',
] as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';