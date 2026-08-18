import { Module } from '@nestjs/common';
import { AsetService } from './aset.service';
import { AsetController } from './aset.controller';

@Module({
  controllers: [AsetController],
  providers: [AsetService],
  exports: [AsetService],
})
export class AsetModule {}