import { Module } from '@nestjs/common';
import { BeritaAcaraService } from './berita-acara.service';
import { BeritaAcaraController } from './berita-acara.controller';
import { StorageModule } from '../storage/storage.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [StorageModule, DocumentModule],
  controllers: [BeritaAcaraController],
  providers: [BeritaAcaraService],
  exports: [BeritaAcaraService],
})
export class BeritaAcaraModule {}