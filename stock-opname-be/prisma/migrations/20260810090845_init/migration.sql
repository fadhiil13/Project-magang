-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BeritaAcara` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `noRef` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `businessArea` VARCHAR(191) NOT NULL,
    `unitKerja` VARCHAR(191) NOT NULL,
    `tempatKedudukan` VARCHAR(191) NOT NULL,
    `analisa` TEXT NOT NULL,
    `tindakLanjut` TEXT NULL,
    `ttdPimpinanUnitKerja` VARCHAR(191) NULL,
    `namaPimpinanUnitKerja` VARCHAR(191) NULL,
    `nipPimpinanUnitKerja` VARCHAR(191) NULL,
    `jabatanPimpinanUnitKerja` VARCHAR(191) NULL,
    `ttdPimpinanIT` VARCHAR(191) NULL,
    `namaPimpinanIT` VARCHAR(191) NULL,
    `docxPath` VARCHAR(191) NULL,
    `pdfPath` VARCHAR(191) NULL,
    `dokumenStale` BOOLEAN NOT NULL DEFAULT true,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BeritaAcara_noRef_key`(`noRef`),
    INDEX `BeritaAcara_userId_idx`(`userId`),
    INDEX `BeritaAcara_tanggal_idx`(`tanggal`),
    INDEX `BeritaAcara_businessArea_idx`(`businessArea`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AsetRow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomorUrut` INTEGER NOT NULL,
    `nomorInventaris` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NOT NULL,
    `jenisAset` VARCHAR(191) NOT NULL,
    `merek` VARCHAR(191) NOT NULL,
    `sumberData` VARCHAR(191) NOT NULL DEFAULT '',
    `keterangan` VARCHAR(191) NOT NULL DEFAULT '',
    `beritaAcaraId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AsetRow_nomorInventaris_idx`(`nomorInventaris`),
    INDEX `AsetRow_serialNumber_idx`(`serialNumber`),
    INDEX `AsetRow_beritaAcaraId_idx`(`beritaAcaraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BeritaAcara` ADD CONSTRAINT `BeritaAcara_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AsetRow` ADD CONSTRAINT `AsetRow_beritaAcaraId_fkey` FOREIGN KEY (`beritaAcaraId`) REFERENCES `BeritaAcara`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
