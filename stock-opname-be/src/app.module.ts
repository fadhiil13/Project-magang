import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BeritaAcaraModule } from './berita-acara/berita-acara.module';
import { AsetModule } from './aset/aset.module';
import { DocumentModule } from './document/document.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BeritaAcaraModule,
    AsetModule,
    DocumentModule,
  ],
})
export class AppModule {}