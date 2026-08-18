import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true, username: true, nama: true, role: true, createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException(`User #${id} tidak ditemukan`);
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    const { password, ...rest } = dto;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    return this.prisma.user.update({
      where: { id },
      data: { ...rest, ...(hashedPassword ? { password: hashedPassword } : {}) },
      select: { id: true, username: true, nama: true, role: true },
    });
  }

  async remove(id: number, requesterId: number) {
    await this.findOne(id);
    if (id === requesterId) throw new BadRequestException('Tidak bisa menghapus akun sendiri');
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User berhasil dihapus' };
  }
}