import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const nama = process.env.SEED_ADMIN_NAMA ?? 'Administrator';
  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, password: hashed, nama, role: Role.ADMIN },
  });

  console.log(`[seed] Admin: ${admin.username} (id=${admin.id})`);
  console.log('[seed] Ganti password setelah login pertama.');
}

main()
  .catch((e) => { console.error('[seed] Gagal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());