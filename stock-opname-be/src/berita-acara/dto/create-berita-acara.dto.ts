import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsDateString, IsNotEmpty, IsOptional, IsString,
  ValidateNested, ArrayMinSize,
} from 'class-validator';

export class CreateAsetRowDto {
  @ApiProperty({ example: 'IT.057.0824.6.A010.00182' })
  @IsString()
  @IsNotEmpty()
  nomorInventaris: string;

  @ApiProperty({ example: 'UDR0KSD003425007D40601' })
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @ApiProperty({ example: 'PC Desktop' })
  @IsString()
  @IsNotEmpty()
  jenisAset: string;

  @ApiProperty({ example: 'Acer Verinton M Core i5-12400' })
  @IsString()
  @IsNotEmpty()
  merek: string;

  @ApiPropertyOptional({ example: 'Support kai.id' })
  @IsString()
  @IsOptional()
  sumberData?: string;

  @ApiPropertyOptional({ example: 'Operasi' })
  @IsString()
  @IsOptional()
  keterangan?: string;
}

export class CreateBeritaAcaraDto {
  @ApiProperty({ example: '08/07/2026' })
  @IsString()
  @IsNotEmpty()
  noRef: string;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  tanggal: string;

  @ApiProperty({ example: 'B070' })
  @IsString()
  @IsNotEmpty()
  businessArea: string;

  @ApiProperty({ example: 'Operasi' })
  @IsString()
  @IsNotEmpty()
  unitKerja: string;

  @ApiProperty({ example: 'DAOP 7' })
  @IsString()
  @IsNotEmpty()
  tempatKedudukan: string;

  @ApiProperty({ example: 'Aset berada di Unit Operasi...' })
  @IsString()
  @IsNotEmpty()
  analisa: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tindakLanjut?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  namaPimpinanUnitKerja?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  jabatanPimpinanUnitKerja?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nipPimpinanUnitKerja?: string;

  @ApiPropertyOptional({ description: 'Base64 string atau path file di MinIO' })
  @IsString()
  @IsOptional()
  ttdPimpinanUnitKerja?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  namaPimpinanIT?: string;

  @ApiPropertyOptional({ description: 'Base64 string atau path file di MinIO' })
  @IsString()
  @IsOptional()
  ttdPimpinanIT?: string;

  @ApiProperty({ type: [CreateAsetRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAsetRowDto)
  asetRows: CreateAsetRowDto[];
}