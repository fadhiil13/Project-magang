import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from '../document/document.service';
import { CreateBeritaAcaraDto } from './dto/create-berita-acara.dto';
import { UpdateBeritaAcaraDto } from './dto/update-berita-acara.dto';
import { QueryBeritaAcaraDto } from './dto/query-berita-acara.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BeritaAcaraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService,
  ) {}

  // Tanda tangan disimpan langsung sebagai base64 data URI di kolom DB
  // (@db.LongText) — nggak lagi diupload ke storage pihak ketiga.
  private handleSignature(base64OrExisting: string | undefined): string | undefined {
    return base64OrExisting;
  }

  async create(dto: CreateBeritaAcaraDto, userId: number) {
    // 1. Pengecekan No Ref duplikat
    const existing = await this.prisma.beritaAcara.findUnique({
      where: { noRef: dto.noRef },
    });

    if (existing) {
      throw new ConflictException(`No. Ref "${dto.noRef}" sudah dipakai`);
    }

    // 2. Signature dipakai apa adanya (base64), langsung disimpan ke kolom LongText
    const ttdUnitKerjaPath = this.handleSignature(dto.ttdPimpinanUnitKerja);
    const ttdITPath = this.handleSignature(dto.ttdPimpinanIT);
    const ttdPetugasPath = this.handleSignature(dto.ttdPetugas);

    // 3. Simpan ke database
    return this.prisma.beritaAcara.create({
      data: {
        noRef: dto.noRef,
        tanggal: new Date(dto.tanggal),
        businessArea: dto.businessArea,
        unitKerja: dto.unitKerja,
        tempatKedudukan: dto.tempatKedudukan,
        analisa: dto.analisa,
        tindakLanjut: dto.tindakLanjut,
        namaPimpinanUnitKerja: dto.namaPimpinanUnitKerja,
        jabatanPimpinanUnitKerja: dto.jabatanPimpinanUnitKerja,
        nipPimpinanUnitKerja: dto.nipPimpinanUnitKerja,
        ttdPimpinanUnitKerja: ttdUnitKerjaPath,
        namaPimpinanIT: dto.namaPimpinanIT,
        jabatanPimpinanIT: dto.jabatanPimpinanIT,
        nipPimpinanIT: dto.nipPimpinanIT,
        ttdPimpinanIT: ttdITPath,
        namaPetugas: dto.namaPetugas,
        jabatanPetugas: dto.jabatanPetugas,
        nipPetugas: dto.nipPetugas,
        ttdPetugas: ttdPetugasPath,
        userId,
        asetRows: {
          create: dto.asetRows.map((row, index) => ({
            nomorUrut: index + 1,
            nomorInventaris: row.nomorInventaris,
            serialNumber: row.serialNumber,
            jenisAset: row.jenisAset,
            merek: row.merek,
            sumberData: row.sumberData ?? '',
            keterangan: row.keterangan ?? '',
          })),
        },
      },
      include: { asetRows: true, user: { select: { id: true, nama: true, username: true } } },
    });
  }

  async findAll(query: QueryBeritaAcaraDto, userId: number, userRole: Role) {
    const { page = 1, limit = 10, search, startDate, endDate, businessArea } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { noRef: { contains: search } },
        { businessArea: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) where.tanggal.gte = new Date(startDate);
      if (endDate) where.tanggal.lte = new Date(endDate);
    }

    if (businessArea) {
      where.businessArea = businessArea;
    }

    // Catatan: pdfData/docxData sengaja TIDAK di-select di list biar payload
    // list ringan (blob bisa besar). Cukup exists-check via findOne/download.
    const [data, total] = await Promise.all([
      this.prisma.beritaAcara.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          noRef: true,
          tanggal: true,
          businessArea: true,
          unitKerja: true,
          tempatKedudukan: true,
          hasDocument: true,
          dokumenStale: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { asetRows: true } },
          user: { select: { id: true, nama: true, username: true } },
        },
      }),
      this.prisma.beritaAcara.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const ba = await this.prisma.beritaAcara.findUnique({
      where: { id },
      include: {
        asetRows: { orderBy: { nomorUrut: 'asc' } },
        user: { select: { id: true, nama: true, username: true } },
      },
    });

    if (!ba) throw new NotFoundException('Berita Acara tidak ditemukan');
    return ba;
  }

  async update(id: number, dto: UpdateBeritaAcaraDto, userId: number, userRole: Role) {
    const ba = await this.findOne(id);

    if (userRole !== Role.ADMIN && ba.userId !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengubah Berita Acara ini');
    }

    const ttdUnitKerjaPath = this.handleSignature(dto.ttdPimpinanUnitKerja);
    const ttdITPath = this.handleSignature(dto.ttdPimpinanIT);
    const ttdPetugasPath = this.handleSignature(dto.ttdPetugas);

    const { asetRows, ...updateData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (asetRows && asetRows.length > 0) {
        await tx.asetRow.deleteMany({ where: { beritaAcaraId: id } });
      }

      return tx.beritaAcara.update({
        where: { id },
        data: {
          ...updateData,
          tanggal: dto.tanggal ? new Date(dto.tanggal) : undefined,
          ttdPimpinanUnitKerja: ttdUnitKerjaPath,
          ttdPimpinanIT: ttdITPath,
          ttdPetugas: ttdPetugasPath,
          dokumenStale: true,
          ...(asetRows && asetRows.length > 0
            ? {
                asetRows: {
                  create: asetRows.map((row, index) => ({
                    nomorUrut: index + 1,
                    nomorInventaris: row.nomorInventaris,
                    serialNumber: row.serialNumber,
                    jenisAset: row.jenisAset,
                    merek: row.merek,
                    sumberData: row.sumberData ?? '',
                    keterangan: row.keterangan ?? '',
                  })),
                },
              }
            : {}),
        },
        include: { asetRows: true },
      });
    });
  }

  async remove(id: number, userId: number, userRole: Role) {
    await this.findOne(id);

    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Hanya admin yang bisa menghapus Berita Acara');
    }

    await this.prisma.beritaAcara.delete({ where: { id } });
    return { message: 'Berita Acara berhasil dihapus' };
  }

  async generateDocuments(id: number): Promise<{ message: string }> {
    const ba = await this.findOne(id);

    const [pdfBuffer, docxBuffer] = await Promise.all([
      this.documentService.generatePdf(ba),
      this.documentService.generateDocx(ba),
    ]);

    // Simpan langsung sebagai BLOB di kolom database, bukan upload ke cloud.
    // Uint8Array.from(...) dipakai karena tipe `Bytes` Prisma expect
    // Uint8Array<ArrayBuffer>, sedangkan Buffer<ArrayBufferLike> dari
    // Puppeteer/fs kadang nggak persis cocok di TS versi ketat.
    await this.prisma.beritaAcara.update({
      where: { id },
      data: {
        pdfData: Uint8Array.from(pdfBuffer),
        docxData: Uint8Array.from(docxBuffer),
        hasDocument: true,
        dokumenStale: false,
      },
    });

    return { message: 'Dokumen berhasil digenerate' };
  }

  async downloadDocument(id: number, format: string): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const fmt = format.toLowerCase();
    if (fmt !== 'pdf' && fmt !== 'docx') {
      throw new NotFoundException('Format tidak valid. Gunakan pdf atau docx.');
    }

    // Ambil noRef sekalian data blob yang dibutuhkan saja (biar hemat memori)
    const ba = await this.prisma.beritaAcara.findUnique({
      where: { id },
      select: { noRef: true, pdfData: true, docxData: true },
    });

    if (!ba) throw new NotFoundException('Berita Acara tidak ditemukan');

    const fileBuffer = fmt === 'pdf' ? ba.pdfData : ba.docxData;

    if (!fileBuffer) {
      throw new NotFoundException(
        `Dokumen ${fmt.toUpperCase()} belum digenerate. Silakan generate terlebih dahulu.`,
      );
    }

    const filename = `berita-acara-${ba.noRef}.${fmt}`;
    const contentType =
      fmt === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return { buffer: Buffer.from(fileBuffer), filename, contentType };
  }

  async getStatistics(userId: number, userRole: Role) {
    const where = userRole !== Role.ADMIN ? { userId } : {};
    const asetWhere = where.userId ? { beritaAcara: { userId: where.userId } } : {};

    // Tren bulanan — diagregasi manual di JS karena Prisma belum punya
    // date-truncation groupBy yang portable untuk MySQL. Ambil 12 bulan
    // terakhir, dipaginasi 6 bulan per halaman di frontend.
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalBA,
      totalAset,
      businessAreas,
      thisMonth,
      byJenis,
      byBusinessArea,
      recentBAs,
      dokumenSudah,
    ] = await Promise.all([
      this.prisma.beritaAcara.count({ where }),
      this.prisma.asetRow.count({ where: asetWhere }),
      this.prisma.beritaAcara.findMany({
        where,
        select: { businessArea: true },
        distinct: ['businessArea'],
      }),
      this.prisma.beritaAcara.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.asetRow.groupBy({
        by: ['jenisAset'],
        where: asetWhere,
        _count: { _all: true },
      }),
      this.prisma.beritaAcara.groupBy({
        by: ['businessArea'],
        where,
        _count: { _all: true },
      }),
      this.prisma.beritaAcara.findMany({
        where: { ...where, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      this.prisma.beritaAcara.count({ where: { ...where, hasDocument: true } }),
    ]);

    // Bulan-bulan kosong tetap ikut tampil (nol), bukan cuma yang ada datanya
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    const monthlyMap = new Map<string, { label: string; count: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap.set(key, { label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, count: 0 });
    }
    for (const ba of recentBAs) {
      const d = new Date(ba.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = monthlyMap.get(key);
      if (entry) entry.count += 1;
    }

    return {
      totalBeritaAcara: totalBA,
      totalAset,
      totalBusinessArea: businessAreas.length,
      beritaAcaraBulanIni: thisMonth,
      asetByJenis: byJenis
        .map((r) => ({ label: r.jenisAset || 'Tidak diketahui', count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      baByBusinessArea: byBusinessArea
        .map((r) => ({ label: r.businessArea, count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      trendBulanan: Array.from(monthlyMap.values()),
      dokumenSudahDigenerate: dokumenSudah,
      dokumenBelumDigenerate: totalBA - dokumenSudah,
    };
  }
}