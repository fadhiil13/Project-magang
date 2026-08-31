import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Req, Res, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BeritaAcaraService } from './berita-acara.service';
import { CreateBeritaAcaraDto } from './dto/create-berita-acara.dto';
import { UpdateBeritaAcaraDto } from './dto/update-berita-acara.dto';
import { QueryBeritaAcaraDto } from './dto/query-berita-acara.dto';

type AuthReq = Request & { user: { id: number; role: string } };

@ApiTags('Berita Acara')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('berita-acara')
export class BeritaAcaraController {
  constructor(private readonly baService: BeritaAcaraService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Berita Acara baru + aset rows' })
  create(@Body() dto: CreateBeritaAcaraDto, @Req() req: AuthReq) {
    return this.baService.create(dto, req.user.id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Statistik dashboard' })
  getStatistics(@Req() req: AuthReq) {
    return this.baService.getStatistics(req.user.id, req.user.role as any);
  }

  @Get()
  @ApiOperation({ summary: 'List Berita Acara (admin: semua, user: milik sendiri)' })
  findAll(@Query() query: QueryBeritaAcaraDto, @Req() req: AuthReq) {
    return this.baService.findAll(query, req.user.id, req.user.role as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail Berita Acara + aset rows' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.baService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Berita Acara' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBeritaAcaraDto, @Req() req: AuthReq) {
    return this.baService.update(id, dto, req.user.id, req.user.role as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus Berita Acara (admin only)' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthReq) {
    return this.baService.remove(id, req.user.id, req.user.role as any);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate PDF & DOCX, simpan langsung ke database' })
  generate(@Param('id', ParseIntPipe) id: number) {
    return this.baService.generateDocuments(id);
  }

  @Get(':id/download/:format')
  @ApiOperation({ summary: 'Download dokumen (pdf / docx)' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    const { buffer, filename, contentType } = await this.baService.downloadDocument(id, format);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}