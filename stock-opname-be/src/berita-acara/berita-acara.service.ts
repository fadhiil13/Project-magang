import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DocumentService } from '../document/document.service';
import { CreateBeritaAcaraDto } from './dto/create-berita-acara.dto';
import { UpdateBeritaAcaraDto } from './dto/update-berita-acara.dto';
import { QueryBeritaAcaraDto } from './dto/query-berita-acara.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BeritaAcaraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly documentService: DocumentService,
  ) {}

  private async handleSignature(base64OrPath: string | undefined, filename: string): Promise<string | undefined> {
    if (!base64OrPath) return undefined;
    if (base64OrPath.startsWith('data:image')) {
      return this.storageService.uploadBase64(`signatures/${filename}`, base64OrPath);
    }
    return base64OrPath;
  }

  async create(dto: CreateBeritaAcaraDto, userId: number) {
    // 1. Pengecekan No Ref duplikat
    const existing = await this.prisma.beritaAcara.findUnique({
      where: { noRef: dto.noRef },
    });
    
    if (existing) {
      throw new ConflictException(`No. Ref "${dto.noRef}" sudah dipakai`);
    }

    // 2. Jika aman, lanjutkan proses signature
    const ttdUnitKerjaPath = await this.handleSignature(dto.ttdPimpinanUnitKerja, `ba-${dto.noRef}-pimpinan-uk.png`);
    const ttdITPath = await this.handleSignature(dto.ttdPimpinanIT, `ba-${dto.noRef}-pimpinan-it.png`);

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
        ttdPimpinanIT: ttdITPath,
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

    const [data, total] = await Promise.all([
      this.prisma.beritaAcara.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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

    const ttdUnitKerjaPath = await this.handleSignature(dto.ttdPimpinanUnitKerja, `ba-${ba.noRef}-pimpinan-uk.png`);
    const ttdITPath = await this.handleSignature(dto.ttdPimpinanIT, `ba-${ba.noRef}-pimpinan-it.png`);

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

  async generateDocuments(id: number): Promise<{ pdfUrl: string; docxUrl: string }> {
    const ba = await this.findOne(id);

    const [pdfBuffer, docxBuffer] = await Promise.all([
      this.documentService.generatePdf(ba),
      this.documentService.generateDocx(ba),
    ]);

    const baseName = `berita-acara/${ba.noRef}`;
    const [pdfUrl, docxUrl] = await Promise.all([
      this.storageService.upload(`${baseName}.pdf`, pdfBuffer, 'application/pdf'),
      this.storageService.upload(
        `${baseName}.docx`,
        docxBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ]);

    await this.prisma.beritaAcara.update({
      where: { id },
      data: { pdfUrl, docxUrl, dokumenStale: false } as any,
    });

    return { pdfUrl, docxUrl };
  }

  async downloadDocument(id: number, format: string): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const ba = await this.findOne(id);

    const fmt = format.toLowerCase();
    if (fmt !== 'pdf' && fmt !== 'docx') {
      throw new NotFoundException('Format tidak valid. Gunakan pdf atau docx.');
    }

    const fileUrl: string | null = fmt === 'pdf' ? (ba as any).pdfUrl : (ba as any).docxUrl;

    if (!fileUrl) {
      throw new NotFoundException(
        `Dokumen ${fmt.toUpperCase()} belum digenerate. Silakan generate terlebih dahulu.`,
      );
    }

    const buffer = await this.storageService.getBuffer(fileUrl);
    const filename = `berita-acara-${ba.noRef}.${fmt}`;
    const contentType =
      fmt === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return { buffer, filename, contentType };
  }

  async getStatistics(userId: number, userRole: Role) {
    const where = userRole !== Role.ADMIN ? { userId } : {};

    const [totalBA, totalAset, businessAreas, thisMonth] = await Promise.all([
      this.prisma.beritaAcara.count({ where }),
      this.prisma.asetRow.count({
        where: where.userId ? { beritaAcara: { userId: where.userId } } : {},
      }),
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
    ]);

    return {
      totalBeritaAcara: totalBA,
      totalAset,
      totalBusinessArea: businessAreas.length,
      beritaAcaraBulanIni: thisMonth,
    };
  }
}