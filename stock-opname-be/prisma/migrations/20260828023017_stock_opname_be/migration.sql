/*
  Warnings:

  - You are about to drop the column `docxPath` on the `beritaacara` table. All the data in the column will be lost.
  - You are about to drop the column `pdfPath` on the `beritaacara` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `beritaacara` DROP COLUMN `docxPath`,
    DROP COLUMN `pdfPath`,
    ADD COLUMN `docxData` LONGBLOB NULL,
    ADD COLUMN `pdfData` LONGBLOB NULL,
    MODIFY `ttdPimpinanUnitKerja` LONGTEXT NULL,
    MODIFY `ttdPimpinanIT` LONGTEXT NULL;
