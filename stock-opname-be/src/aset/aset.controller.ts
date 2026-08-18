import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AsetService } from './aset.service';

@ApiTags('Aset')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('aset')
export class AsetController {
  constructor(private readonly asetService: AsetService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search aset by nomor inventaris atau serial number' })
  @ApiQuery({ name: 'q', required: true, description: 'Keyword pencarian (min 3 karakter)' })
  search(@Query('q') q: string) {
    return this.asetService.search(q);
  }

  @Get(':nomorInventaris/history')
  @ApiOperation({ summary: 'Histori lokasi aset berdasarkan nomor inventaris' })
  getHistory(@Param('nomorInventaris') nomorInventaris: string) {
    return this.asetService.getHistory(nomorInventaris);
  }
}