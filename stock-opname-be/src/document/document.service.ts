import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  // ============================================================
  // PDF GENERATION (HTML/CSS → Puppeteer)
  // ============================================================

  async generatePdf(data: any): Promise<Buffer> {
    const html = this.buildPdfHtml(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      // Samain tinggi kotak Analisa & Tindak Lanjut biar keliatan seimbang
      // walau isinya beda panjang (atau salah satunya kosong) — diukur dari
      // render beneran (bukan nebak), lalu dipaksa sama-sama setinggi yang
      // paling tinggi di antara keduanya.
      await page.evaluate(() => {
        const boxes = Array.from(
          document.querySelectorAll<HTMLElement>('[data-role="analisa-box"], [data-role="tindak-box"]'),
        );
        if (boxes.length === 0) return;
        const maxHeight = Math.max(...boxes.map((el) => el.getBoundingClientRect().height));
        boxes.forEach((el) => {
          el.style.minHeight = `${maxHeight}px`;
        });
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildPdfHtml(data: any): string {
    const chunks: any[][] = [];
    for (let i = 0; i < data.asetRows.length; i += 12) {
      chunks.push(data.asetRows.slice(i, i + 12));
    }
    const totalPages = 1 + chunks.length;

    const tgl = new Date(data.tanggal);
    const tanggalLong = tgl.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const tanggalShort = tgl.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const logoPath = path.join(__dirname, 'templates', 'kai-logo.png');
    let logoBase64 = '';
    if (fs.existsSync(logoPath)) {
      logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
    } else {
      this.logger.warn(`Logo tidak ditemukan di ${logoPath} — PDF akan pakai fallback teks "KAI"`);
    }

    // Badge "TERBATAS" — kalau ada file gambar di templates/terbatas.png,
    // dipakai apa adanya (misal stempel/logo custom). Kalau nggak ada,
    // fallback ke teks + highlight kuning lewat CSS (.terbatas).
    const terbatasPath = path.join(__dirname, 'templates', 'terbatas.png');
    let terbatasBase64 = '';
    if (fs.existsSync(terbatasPath)) {
      terbatasBase64 = `data:image/png;base64,${fs.readFileSync(terbatasPath).toString('base64')}`;
    }

    const ttdUK = data.ttdPimpinanUnitKerja || '';
    const ttdIT = data.ttdPimpinanIT || '';
    const ttdPetugas = data.ttdPetugas || '';

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${this.getPdfStyles()}</style></head><body>`;

    // ── HALAMAN 1: Form utama ──
    html += `<div class="page">`;
    html += this.buildPdfHeader(data, logoBase64, terbatasBase64, 1, totalPages, tanggalShort);
    html += `
      <div class="content">
        <p class="section-num">I. <b>Pelaksanaan Stock Opname</b></p>
        <p class="indent">Dilaksanakan Stock Opname, sebagai berikut:</p>

        <table class="info-fields">
          <tr><td class="label">Tanggal Stock Opname</td><td class="colon">:</td><td class="value">${this.escapeHtml(tanggalLong)}</td></tr>
          <tr><td class="label">Unit Kerja</td><td class="colon">:</td><td class="value">${this.escapeHtml(data.unitKerja)}</td></tr>
          <tr><td class="label">Tempat Kedudukan</td><td class="colon">:</td><td class="value">${this.escapeHtml(data.tempatKedudukan)}</td></tr>
        </table>

        <p class="section-num" style="margin-top:16px;">II. <b>Analisa &amp; Tindak Lanjut</b></p>

        <div class="bordered-box" data-role="analisa-box">
          <p class="underline-italic">Analisa:</p>
          <p>${this.escapeHtml(data.analisa || '').replace(/\n/g, '<br>')}</p>
        </div>
        <div class="bordered-box" data-role="tindak-box">
          <p class="underline-italic">Tindak Lanjut:</p>
          <p>${data.tindakLanjut ? this.escapeHtml(data.tindakLanjut).replace(/\n/g, '<br>') : '&nbsp;'}</p>
        </div>

        <p style="margin-top:16px;">Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat digunakan sebagaimana mestinya.</p>

        <p style="text-align:right;margin-top:28px;">${this.escapeHtml(data.tempatKedudukan || '....................')},  ${this.escapeHtml(tanggalLong)}</p>

        <table class="ttd-table">
          <tr>
            <td>
              <p>Pimpinan Unit Kerja</p>
              <p>${this.escapeHtml(data.jabatanPimpinanUnitKerja || '')}</p>
              <div class="ttd-space">${ttdUK ? `<img src="${ttdUK}" class="ttd-img"/>` : ''}</div>
              <p class="ttd-name">(${this.escapeHtml(data.namaPimpinanUnitKerja || '___________________')})</p>
              <p>${this.escapeHtml(data.nipPimpinanUnitKerja || '')}</p>
            </td>
            <td>
              <p>Pimpinan IT Kantor Pusat/Daerah</p>
              <p>${this.escapeHtml(data.jabatanPimpinanIT || '(Pengelola Aset TI)')}</p>
              <div class="ttd-space">${ttdIT ? `<img src="${ttdIT}" class="ttd-img"/>` : ''}</div>
              <p class="ttd-name">(${this.escapeHtml(data.namaPimpinanIT || '___________________')})</p>
              <p>${this.escapeHtml(data.nipPimpinanIT || '')}</p>
            </td>
          </tr>
        </table>
      </div>
    </div>`;

    // ── HALAMAN 2+: Tabel aset (max 12 baris per halaman) ──
    chunks.forEach((chunk, ci) => {
      const pageNum = ci + 2;
      const startNo = ci * 12 + 1;

      html += `<div class="page">`;
      html += this.buildPdfHeader(data, logoBase64, terbatasBase64, pageNum, totalPages, tanggalShort);
      html += `
        <div class="content">
          <p style="text-align:right;font-size:8pt;font-style:italic;">
            Lampiran Formulir<br>Stock Opname Data Aset Teknologi Informasi
          </p>
          <p style="text-align:center;margin:10px 0;"><b>Stock Opname</b><br><b>Data Aset Teknologi Informasi</b></p>

          <table class="aset-table">
            <thead>
              <tr>
                <th style="width:30px;">No</th>
                <th style="width:150px;">Nomor Inventaris Aset</th>
                <th style="width:120px;">Serial Number</th>
                <th style="width:80px;">Jenis Aset TI</th>
                <th>Merek</th>
                <th style="width:80px;">Sumber Data</th>
                <th style="width:70px;">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${chunk
                .map(
                  (r: any, i: number) => `<tr>
                <td style="text-align:center;">${startNo + i}</td>
                <td>${this.escapeHtml(r.nomorInventaris)}</td>
                <td>${this.escapeHtml(r.serialNumber)}</td>
                <td>${this.escapeHtml(r.jenisAset)}</td>
                <td>${this.escapeHtml(r.merek)}</td>
                <td>${this.escapeHtml(r.sumberData)}</td>
                <td>${this.escapeHtml(r.keterangan)}</td>
              </tr>`,
                )
                .join('')}
            </tbody>
          </table>

          <div style="text-align:right;margin-top:auto;padding-top:40px;">
            <div style="display:inline-block;text-align:center;padding:4px 10px;min-width:110px;font-size:8pt;">
              <p>Petugas IT Stock Opname</p>
              ${data.jabatanPetugas ? `<p>${this.escapeHtml(data.jabatanPetugas)}</p>` : ''}
              <div class="ttd-space" style="height:28px;margin-top:6px;">${ttdPetugas ? `<img src="${ttdPetugas}" class="ttd-img" style="max-height:26px;max-width:80px;"/>` : ''}</div>
              <p class="ttd-name" style="margin-top:0;">(${this.escapeHtml(data.namaPetugas || '___________________')})</p>
              <p>${this.escapeHtml(data.nipPetugas || '')}</p>
            </div>
          </div>
        </div>
      </div>`;
    });

    html += `</body></html>`;
    return html;
  }

  private buildPdfHeader(
    data: any,
    logo: string,
    terbatas: string,
    page: number,
    total: number,
    tanggal: string,
  ): string {
    return `
      <table class="header-main">
        <tr>
          <td rowspan="2" class="logo-cell">${
            logo
              ? `<img src="${logo}" class="logo"/>`
              : '<b style="font-size:20pt;color:#2D2B70;">KAI</b>'
          }</td>
          <td rowspan="2" class="title-cell">
            <b>PT KERETA API INDONESIA (PERSERO)</b><br><b>SISTEM INFORMASI</b>
          </td>
          <td class="info-label">Nomor</td><td class="info-value">FR.SM/TI/011.010/04-2021</td>
        </tr>
        <tr><td class="info-label">Tanggal</td><td class="info-value">13 April 2021</td></tr>
        <tr>
          <td rowspan="2" class="logo-cell">${
            terbatas
              ? `<img src="${terbatas}" class="terbatas-img"/>`
              : '<span class="terbatas">TERBATAS</span>'
          }</td>
          <td rowspan="2" class="title-cell">
            <b>FORMULIR BERITA ACARA<br>STOCK OPNAME ASET TEKNOLOGI INFORMASI</b>
          </td>
          <td class="info-label">Versi</td><td class="info-value">001-2021</td>
        </tr>
        <tr><td class="info-label">Halaman</td><td class="info-value">${page} dari ${total}</td></tr>
      </table>
      <table class="ref-box">
        <tr><td>No. Ref</td><td>:</td><td>${this.escapeHtml(data.noRef)}</td></tr>
        <tr><td>Tanggal</td><td>:</td><td>${tanggal}</td></tr>
        <tr><td>Business Area</td><td>:</td><td>${this.escapeHtml(data.businessArea)}</td></tr>
      </table>`;
  }

  private getPdfStyles(): string {
    return `
      @page { size: A4; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #000; }
      .page { width: 210mm; min-height: 297mm; padding: 12mm 12mm 10mm 12mm; page-break-after: always; display: flex; flex-direction: column; }
      .page:last-child { page-break-after: auto; }
      .content { flex: 1; }
      .header-main { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 6px; }
      .header-main td { border: 1px solid #000; padding: 3px 6px; font-size: 9pt; vertical-align: middle; }
      .logo-cell { width: 100px; text-align: center; padding: 4px !important; }
      .logo { width: 90px; height: auto; display: block; margin: 0 auto; }
      .title-cell { text-align: center; }
      .info-label { width: 55px; font-weight: bold; background: #f5f5f5; font-size: 8pt; }
      .info-value { width: 150px; font-size: 8pt; }
      .terbatas { display: inline-block; background: #FFE500; color: #000; padding: 1px 10px; font-weight: bold; font-size: 9pt; }
      .terbatas-img { width: 90px; height: auto; display: block; margin: 0 auto; }
      .ref-box { border-collapse: collapse; margin-bottom: 10px; width: 260px; }
      .ref-box td { border: 1px solid #000; padding: 2px 6px; font-size: 10pt; }
      .ref-box td:first-child { width: 95px; white-space: nowrap; }
      .ref-box td:nth-child(2) { width: 12px; text-align: center; }
      .ref-box td:nth-child(3) { width: 153px; }
      .section-num { margin: 8px 0 4px 0; font-size: 11pt; }
      .indent { margin-left: 24px; margin-bottom: 8px; }
      .info-fields { margin-left: 40px; border-collapse: collapse; }
      .info-fields td { padding: 3px 6px; font-size: 10pt; }
      .info-fields .label { width: 170px; }
      .info-fields .colon { width: 15px; text-align: center; }
      .bordered-box { border: 1px solid #000; padding: 8px 10px; margin: 6px 0 6px 24px; min-height: 50px; }
      .underline-italic { font-style: italic; text-decoration: underline; margin-bottom: 6px; }
      .ttd-table { width: 70%; margin: 28px auto 0; }
      .ttd-table td { width: 50%; text-align: center; vertical-align: top; padding: 4px; }
      .ttd-space { height: 60px; display: flex; align-items: center; justify-content: center; margin-top: 18px; }
      .ttd-img { max-height: 55px; max-width: 120px; }
      .ttd-name { font-weight: bold; }
      .aset-table { width: 100%; border-collapse: collapse; }
      .aset-table th, .aset-table td { border: 1px solid #000; padding: 3px 5px; font-size: 9pt; }
      .aset-table th { background: #f5f5f5; text-align: center; font-weight: bold; }
    `;
  }

  private escapeHtml(text: string): string {
    return (text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ============================================================
  // DOCX GENERATION (unzip template → edit XML → rezip)
  // ============================================================

  async generateDocx(data: any): Promise<Buffer> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-'));
    const templatePath = path.join(__dirname, 'templates', 'template.docx');
    const unpackDir = path.join(tmpDir, 'unpacked');
    const outputPath = path.join(tmpDir, 'output.docx');

    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Template DOCX tidak ditemukan di ${templatePath}. Pastikan file template.docx sudah ditaruh di src/document/templates/.`,
      );
    }

    try {
      fs.mkdirSync(unpackDir, { recursive: true });

      // Windows nggak punya unzip/zip bawaan — pakai PowerShell.
      // Expand-Archive/Compress-Archive cuma terima ekstensi .zip,
      // jadi kita copy .docx → .zip dulu sebelum extract.
      if (process.platform === 'win32') {
        const templateZip = path.join(tmpDir, 'template.zip');
        fs.copyFileSync(templatePath, templateZip);
        execSync(
          `powershell -NoProfile -Command "Expand-Archive -Path '${templateZip}' -DestinationPath '${unpackDir}' -Force"`,
          { stdio: 'pipe' },
        );
      } else {
        execSync(`unzip -q "${templatePath}" -d "${unpackDir}"`, { stdio: 'pipe' });
        // Hapus symlink kalau ada — keamanan, cegah path traversal via symlink jahat
        execSync(`find "${unpackDir}" -type l -delete`, { stdio: 'pipe' });
      }

      const tgl = new Date(data.tanggal);
      const tanggalLong = tgl.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const tanggalShort = `${String(tgl.getDate()).padStart(2, '0')} / ${String(
        tgl.getMonth() + 1,
      ).padStart(2, '0')} / ${tgl.getFullYear()}`;
      const totalPages = 1 + Math.ceil(data.asetRows.length / 12);

      this.editHeaderXml(unpackDir, data, tanggalShort, totalPages);
      this.editDocumentXml(unpackDir, data, tanggalLong);
      this.editFooterXml(unpackDir, data);

      // Rezip
      if (process.platform === 'win32') {
        // Compress-Archive juga cuma mau nulis ke .zip — sama seperti extract,
        // compress dulu ke output.zip lalu copy jadi output.docx.
        const outputZip = path.join(tmpDir, 'output.zip');
        if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        execSync(
          `powershell -NoProfile -Command "Compress-Archive -Path '${unpackDir}\\*' -DestinationPath '${outputZip}' -Force"`,
          { stdio: 'pipe' },
        );
        fs.copyFileSync(outputZip, outputPath);
      } else {
        execSync(`cd "${unpackDir}" && rm -f "${outputPath}" && zip -Xr "${outputPath}" .`, {
          stdio: 'pipe',
        });
      }

      return fs.readFileSync(outputPath);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  private editFooterXml(unpackDir: string, data: any) {
    const footerPath = path.join(unpackDir, 'word', 'footer1.xml');
    if (!fs.existsSync(footerPath)) return;

    let xml = fs.readFileSync(footerPath, 'utf-8');

    // Kotak "Petugas IT Stock Opname" di footer punya baris kosong di
    // bawah labelnya (untuk spasi TTD lalu nama). Isi paragraf KEDUA
    // (index 1) dengan nama petugas — sama gaya "( nama )" seperti dua
    // TTD lain. Gambar TTD sendiri belum di-render di DOCX (baru ada di
    // PDF), konsisten dengan Pimpinan Unit Kerja/IT yang juga cuma
    // nama teks di DOCX.
    const marker = 'Opname</w:t>';
    const markerPos = xml.indexOf(marker);
    if (markerPos !== -1) {
      const target = this.nthParagraphAfter(xml, markerPos, 1);
      if (target) {
        const value = data.namaPetugas ? `( ${data.namaPetugas} )` : '';
        xml = this.replaceParagraphInner(xml, target.openEnd, target.closeIdx, value).xml;
      }
    }

    fs.writeFileSync(footerPath, xml, 'utf-8');
  }

  private editHeaderXml(unpackDir: string, data: any, tanggalShort: string, totalPages: number) {
    for (const headerFile of ['header1.xml', 'header2.xml']) {
      const headerPath = path.join(unpackDir, 'word', headerFile);
      if (!fs.existsSync(headerPath)) continue;

      let xml = fs.readFileSync(headerPath, 'utf-8');

      // header2.xml = first-page header (titlePg), header1.xml = default (halaman 2+)
      if (headerFile === 'header2.xml') {
        xml = xml.replace(/1 dari 2/g, `1 dari ${totalPages}`);
      } else {
        xml = xml.replace(/2 dari 2/g, `2 dari ${totalPages}`);
      }

      // No. Ref / Tanggal / Business Area (kotak ref di bawah judul formulir).
      // Dicari berurutan (cursor maju), karena "Tanggal" juga muncul di baris
      // revisi dokumen ("Tanggal 13 April 2021") duluan di atasnya — kalau
      // dicari dari awal dokumen, bisa salah timpa baris itu.
      const filler = this.createSequentialFiller(xml);
      filler.fill('<w:t>No. Ref</w:t>', 1, data.noRef);
      filler.fill('>Tanggal<', 1, tanggalShort);
      filler.fill('Business Area', 1, data.businessArea);
      xml = filler.result();

      fs.writeFileSync(headerPath, xml, 'utf-8');
    }
  }

  private editDocumentXml(unpackDir: string, data: any, tanggalLong: string) {
    const docPath = path.join(unpackDir, 'word', 'document.xml');
    let xml = fs.readFileSync(docPath, 'utf-8');

    // Section I: Tanggal Stock Opname / Unit Kerja / Tempat Kedudukan.
    // Ketiga cell value-nya ditandai border bawah putus-putus (dotted) yang
    // sama persis di template, jadi dicari berdasar urutan kemunculannya
    // (occurrence 0/1/2), bukan cocokin teks label — labelnya sering
    // kepecah jadi beberapa <w:t> terpisah gara-gara spell-check Word,
    // jadi regex teks-mentah gampang gagal cocok.
    const dottedCellBorder = 'w:bottom w:val="dotted" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders>';
    xml = this.setCellValueAfterMarker(xml, dottedCellBorder, 0, tanggalLong);
    xml = this.setCellValueAfterMarker(xml, dottedCellBorder, 1, data.unitKerja);
    xml = this.setCellValueAfterMarker(xml, dottedCellBorder, 2, data.tempatKedudukan);

    // Section II: Analisa (ganti semua paragraf antara label "Analisa:" dan
    // "Tindak Lanjut:" dengan isi data.analisa, satu paragraf per baris).
    const analisaLines = (data.analisa || '').split('\n');
    xml = this.replaceParagraphsBetween(xml, 'Analisa:</w:t>', 'Tindak Lanjut:', analisaLines);

    // Tindak Lanjut (ganti semua paragraf antara label ini dan penutup tabel).
    const tindakLines = (data.tindakLanjut || '-').split('\n');
    xml = this.replaceParagraphsBetween(xml, 'Tindak Lanjut:</w:t>', '</w:tbl>', tindakLines);

    // Tanggal & kota di baris tanda tangan
    xml = this.replaceXmlTextPattern(
      xml,
      /……………….\.*/,
      this.escapeXml(`${data.tempatKedudukan}, ${tanggalLong}`),
    );
    xml = this.replaceXmlTextPattern(xml, /\.{3,}\s*-\s*\.{3,}\s*-\s*\.{10,}/, '');

    // Nama pimpinan — ada 2 slot "( _____ )" di template: unit kerja lalu IT
    let nameReplaced = 0;
    xml = xml.replace(/\(\s*_{5,}\s*\)/g, () => {
      nameReplaced++;
      if (nameReplaced === 1) {
        return `( ${this.escapeXml(data.namaPimpinanUnitKerja || '___________________')} )`;
      }
      return `( ${this.escapeXml(data.namaPimpinanIT || '___________________')} )`;
    });

    // Tabel aset: cari tabel yang mengandung header "Invetaris", replace baris kosong
    // dengan baris data sebanyak asetRows.length
    const asetTableRegex = /(<w:tbl>(?:(?!<w:tbl>)[\s\S])*?Invetaris[\s\S]*?<\/w:tbl>)/;
    const asetTableMatch = xml.match(asetTableRegex);

    if (asetTableMatch) {
      const originalTable = asetTableMatch[1];
      const allRows = originalTable.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
      const headerRow = allRows.length > 0 ? allRows[0] : '';

      const newRows = data.asetRows
        .map((row: any, i: number) => this.buildAsetRowXml(i + 1, row))
        .join('');

      const tblPrMatch = originalTable.match(/(<w:tblPr>[\s\S]*?<\/w:tblPr>)/);
      const tblGridMatch = originalTable.match(/(<w:tblGrid>[\s\S]*?<\/w:tblGrid>)/);
      const tblPr = tblPrMatch ? tblPrMatch[1] : '';
      const tblGrid = tblGridMatch ? tblGridMatch[1] : '';

      const newTable = `<w:tbl>${tblPr}${tblGrid}${headerRow}${newRows}</w:tbl>`;
      xml = xml.replace(originalTable, newTable);
    } else {
      this.logger.warn(
        'Tabel aset (marker "Invetaris") tidak ditemukan di document.xml — cek apakah template berubah',
      );
    }

    fs.writeFileSync(docPath, xml, 'utf-8');
  }

  // ============================================================
  // XML STRUCTURAL HELPERS (bukan cari-teks-mentah — navigasi struktur
  // <w:p>/<w:tc> biar nggak gagal gara-gara teks kepecah beberapa <w:t>
  // akibat spell-check Word)
  // ============================================================

  private buildRunXml(text: string): string {
    return `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${this.escapeXml(text)}</w:t></w:r>`;
  }

  private buildParagraphXml(text: string): string {
    return `<w:p>${this.buildRunXml(text)}</w:p>`;
  }

  /** Index tempat <w:p> (bukan <w:pPr>/<w:pStyle> dst) TERAKHIR sebelum `beforePos`. */
  private lastParagraphStart(xml: string, beforePos: number): number {
    const re = /<w:p(?=[ >])/g;
    let match: RegExpExecArray | null;
    let last = -1;
    while ((match = re.exec(xml)) && match.index < beforePos) {
      last = match.index;
    }
    return last;
  }

  /** Cari [openEnd, closeIdx] dari <w:p> ke-n (0-based) setelah posisi `fromPos`. */
  private nthParagraphAfter(
    xml: string,
    fromPos: number,
    n: number,
  ): { openEnd: number; closeIdx: number } | null {
    let pos = fromPos;
    let openEnd = -1;
    let closeIdx = -1;
    for (let i = 0; i <= n; i++) {
      const rest = xml.slice(pos);
      const m = /<w:p(?=[ >])[^>]*>/.exec(rest);
      if (!m) return null;
      openEnd = pos + m.index + m[0].length;
      closeIdx = xml.indexOf('</w:p>', openEnd);
      if (closeIdx === -1) return null;
      pos = closeIdx + '</w:p>'.length;
    }
    return { openEnd, closeIdx };
  }

  /** Ganti isi (semua run) sebuah paragraf dengan satu run baru berisi `value`, sambil tetap pertahankan <w:pPr>-nya (formatting). */
  private replaceParagraphInner(
    xml: string,
    openEnd: number,
    closeIdx: number,
    value: string,
  ): { xml: string; insertedLength: number } {
    const inner = xml.slice(openEnd, closeIdx);
    const pPrMatch = /^\s*<w:pPr>[\s\S]*?<\/w:pPr>/.exec(inner);
    const pPr = pPrMatch ? pPrMatch[0] : '';
    const run = this.buildRunXml(value);
    return {
      xml: xml.slice(0, openEnd) + pPr + run + xml.slice(closeIdx),
      insertedLength: pPr.length + run.length,
    };
  }

  /**
   * Cari kemunculan ke-`occurrenceIndex` dari `marker`, lalu isi paragraf
   * PERTAMA setelahnya dengan `value` (dipakai untuk cell yang ditandai
   * fingerprint unik seperti border dotted, bukan lewat teks label).
   */
  private setCellValueAfterMarker(
    xml: string,
    marker: string,
    occurrenceIndex: number,
    value: string,
  ): string {
    let searchFrom = 0;
    let markerPos = -1;
    for (let i = 0; i <= occurrenceIndex; i++) {
      markerPos = xml.indexOf(marker, searchFrom);
      if (markerPos === -1) return xml;
      searchFrom = markerPos + marker.length;
    }
    const target = this.nthParagraphAfter(xml, markerPos, 0);
    if (!target) return xml;
    return this.replaceParagraphInner(xml, target.openEnd, target.closeIdx, value).xml;
  }

  /**
   * Ganti seluruh paragraf di ANTARA akhir paragraf berisi `afterMarker` dan
   * awal paragraf berisi `beforeMarker`, dengan satu paragraf baru per baris
   * di `lines`. Dipakai untuk box Analisa & Tindak Lanjut yang isinya bisa
   * beberapa paragraf placeholder kosong/statis di template.
   */
  private replaceParagraphsBetween(
    xml: string,
    afterMarker: string,
    beforeMarker: string,
    lines: string[],
  ): string {
    const afterPos = xml.indexOf(afterMarker);
    if (afterPos === -1) return xml;
    const afterPClose = xml.indexOf('</w:p>', afterPos);
    if (afterPClose === -1) return xml;
    const rangeStart = afterPClose + '</w:p>'.length;

    const beforePos = xml.indexOf(beforeMarker, rangeStart);
    if (beforePos === -1) return xml;
    const rangeEnd = this.lastParagraphStart(xml, beforePos);
    if (rangeEnd === -1 || rangeEnd < rangeStart) return xml;

    const safeLines = lines.length > 0 ? lines : [''];
    const newParagraphs = safeLines.map((l) => this.buildParagraphXml(l)).join('');
    return xml.slice(0, rangeStart) + newParagraphs + xml.slice(rangeEnd);
  }

  /**
   * Filler berurutan: tiap `fill()` nyari marker MULAI DARI posisi hasil
   * fill sebelumnya (bukan dari awal dokumen). Perlu karena beberapa label
   * (mis. "Tanggal") muncul lebih dari sekali di header — pencarian dari
   * awal dokumen bisa salah nimpa kemunculan yang duluan.
   */
  private createSequentialFiller(initialXml: string) {
    let xml = initialXml;
    let cursor = 0;
    return {
      fill: (marker: string, skipParagraphs: number, value: string) => {
        const markerPos = xml.indexOf(marker, cursor);
        if (markerPos === -1) return;
        const target = this.nthParagraphAfter(xml, markerPos, skipParagraphs);
        if (!target) return;
        const r = this.replaceParagraphInner(xml, target.openEnd, target.closeIdx, value);
        xml = r.xml;
        cursor = target.openEnd + r.insertedLength;
      },
      result: () => xml,
    };
  }

  private buildAsetRowXml(no: number, row: any): string {
    const cells = [
      String(no),
      row.nomorInventaris,
      row.serialNumber,
      row.jenisAset,
      row.merek,
      row.sumberData,
      row.keterangan,
    ];

    const cellsXml = cells
      .map(
        (text) => `
      <w:tc>
        <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
        <w:p>
          <w:pPr>
            <w:jc w:val="center"/>
            <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
            <w:t xml:space="preserve">${this.escapeXml(text)}</w:t>
          </w:r>
        </w:p>
      </w:tc>
    `,
      )
      .join('');

    return `<w:tr><w:trPr><w:trHeight w:val="300"/></w:trPr>${cellsXml}</w:tr>`;
  }

  private replaceXmlTextPattern(xml: string, pattern: RegExp, replacement: string): string {
    return xml.replace(pattern, replacement);
  }

  private escapeXml(text: string): string {
    return (text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}