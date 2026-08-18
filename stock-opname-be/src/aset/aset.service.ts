import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsetService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    if (!q || q.length < 3) return [];

    const rows = await this.prisma.asetRow.findMany({
      where: {
        OR: [
          { nomorInventaris: { contains: q } },
          { serialNumber: { contains: q } },
        ],
      },
      include: {
        beritaAcara: {
          select: {
            id: true, noRef: true, tanggal: true,
            businessArea: true, unitKerja: true, tempatKedudukan: true,
          },
        },
      },
      orderBy: { beritaAcara: { tanggal: 'desc' } },
    });

    const grouped = new Map<string, any>();

    for (const row of rows) {
      const key = row.nomorInventaris;
      if (!grouped.has(key)) {
        grouped.set(key, {
          nomorInventaris: row.nomorInventaris,
          serialNumber: row.serialNumber,
          jenisAset: row.jenisAset,
          merek: row.merek,
          latestLocation: {
            businessArea: row.beritaAcara.businessArea,
            unitKerja: row.beritaAcara.unitKerja,
            tempatKedudukan: row.beritaAcara.tempatKedudukan,
            tanggal: row.beritaAcara.tanggal,
            noRef: row.beritaAcara.noRef,
          },
          beritaAcaraCount: 1,
        });
      } else {
        grouped.get(key).beritaAcaraCount++;
      }
    }

    return Array.from(grouped.values());
  }

  async getHistory(nomorInventaris: string) {
    const rows = await this.prisma.asetRow.findMany({
      where: { nomorInventaris },
      include: {
        beritaAcara: {
          select: {
            id: true, noRef: true, tanggal: true,
            businessArea: true, unitKerja: true, tempatKedudukan: true,
          },
        },
      },
      orderBy: { beritaAcara: { tanggal: 'desc' } },
    });

    return rows.map((row) => ({
      beritaAcaraId: row.beritaAcara.id,
      noRef: row.beritaAcara.noRef,
      tanggal: row.beritaAcara.tanggal,
      businessArea: row.beritaAcara.businessArea,
      unitKerja: row.beritaAcara.unitKerja,
      tempatKedudukan: row.beritaAcara.tempatKedudukan,
      merek: row.merek,
      jenisAset: row.jenisAset,
      keterangan: row.keterangan,
    }));
  }
}