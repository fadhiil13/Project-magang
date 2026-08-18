import { PartialType } from '@nestjs/swagger';
import { CreateBeritaAcaraDto } from './create-berita-acara.dto';

export class UpdateBeritaAcaraDto extends PartialType(CreateBeritaAcaraDto) {}