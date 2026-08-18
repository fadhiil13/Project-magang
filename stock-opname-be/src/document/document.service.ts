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

    const ttdUK = data.ttdPimpinanUnitKerja || '';
    const ttdIT = data.ttdPimpinanIT || '';

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${this.getPdfStyles()}</style></head><body>`;

    // ── HALAMAN 1: Form utama ──
    html += `<div class="page">`;
    html += this.buildPdfHeader(data, logoBase64, 1, totalPages, tanggalShort);
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

        <div class="bordered-box">
          <p class="underline-italic">Analisa:</p>
          <p>${this.escapeHtml(data.analisa || '').replace(/\n/g, '<br>')}</p>
        </div>
        <div class="bordered-box">
          <p class="underline-italic">Tindak Lanjut:</p>
          <p>${data.tindakLanjut ? this.escapeHtml(data.tindakLanjut).replace(/\n/g, '<br>') : '&nbsp;'}</p>
        </div>

        <p style="margin-top:16px;">Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat digunakan sebagaimana mestinya.</p>

        <p style="text-align:right;margin-top:12px;">${this.escapeHtml(data.tempatKedudukan || '....................')},  ${this.escapeHtml(tanggalLong)}</p>

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
              <p>(Pengelola Aset TI)</p>
              <div class="ttd-space">${ttdIT ? `<img src="${ttdIT}" class="ttd-img"/>` : ''}</div>
              <p class="ttd-name">(${this.escapeHtml(data.namaPimpinanIT || '___________________')})</p>
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
      html += this.buildPdfHeader(data, logoBase64, pageNum, totalPages, tanggalShort);
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
            <div style="display:inline-block;text-align:center;border:1px solid #000;padding:4px 12px;">
              Petugas IT Stock Opname
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
    page: number,
    total: number,
    tanggal: string,
  ): string {
    return `
      <table class="header-main">
        <tr>
          <td rowspan="4" class="logo-cell">${
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
          <td rowspan="2" class="title-cell">
            <span class="terbatas">TERBATAS</span><br>
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
      .logo-cell { width: 70px; text-align: center; }
      .logo { height: 50px; }
      .title-cell { text-align: center; }
      .info-label { width: 55px; font-weight: bold; background: #f5f5f5; font-size: 8pt; }
      .info-value { width: 150px; font-size: 8pt; }
      .terbatas { display: inline-block; background: #FFE500; color: #000; padding: 1px 10px; font-weight: bold; font-size: 9pt; }
      .ref-box { border-collapse: collapse; margin-bottom: 10px; }
      .ref-box td { border: 1px solid #000; padding: 2px 6px; font-size: 10pt; }
      .ref-box td:first-child { width: 90px; }
      .ref-box td:nth-child(2) { width: 15px; text-align: center; }
      .section-num { margin: 8px 0 4px 0; font-size: 11pt; }
      .indent { margin-left: 24px; margin-bottom: 8px; }
      .info-fields { margin-left: 40px; border-collapse: collapse; }
      .info-fields td { padding: 3px 6px; font-size: 10pt; }
      .info-fields .label { width: 170px; }
      .info-fields .colon { width: 15px; text-align: center; }
      .bordered-box { border: 1px solid #000; padding: 8px 10px; margin: 6px 0 6px 24px; min-height: 50px; }
      .underline-italic { font-style: italic; text-decoration: underline; margin-bottom: 6px; }
      .ttd-table { width: 70%; margin: 10px auto 0; }
      .ttd-table td { width: 50%; text-align: center; vertical-align: top; padding: 4px; }
      .ttd-space { height: 60px; display: flex; align-items: center; justify-content: center; }
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

      this.editHeaderXml(unpackDir, tanggalShort, totalPages);
      this.editDocumentXml(unpackDir, data, tanggalLong);

      // Rezip
      if (process.platform === 'win32') {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        execSync(
          `powershell -NoProfile -Command "Compress-Archive -Path '${unpackDir}\\*' -DestinationPath '${outputPath}' -Force"`,
          { stdio: 'pipe' },
        );
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

  private editHeaderXml(unpackDir: string, tanggal: string, totalPages: number) {
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

      xml = this.replaceXmlText(xml, '___ /___ /______', tanggal);
      xml = this.replaceXmlText(xml, '___/___/______', tanggal);

      fs.writeFileSync(headerPath, xml, 'utf-8');
    }
  }

  private editDocumentXml(unpackDir: string, data: any, tanggalLong: string) {
    const docPath = path.join(unpackDir, 'word', 'document.xml');
    let xml = fs.readFileSync(docPath, 'utf-8');

    // Section I: Tempat Kedudukan
    xml = this.replaceXmlTextPattern(
      xml,
      /Kantor Pusat \/ DAOP[^<]*/,
      this.escapeXml(data.tempatKedudukan),
    );

    // Section II: Analisa
    xml = this.replaceXmlTextPattern(
      xml,
      /Detail Data Aset TI dituangkan[^<]*/,
      this.escapeXml((data.analisa || '').replace(/\n/g, ' ')),
    );

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

  private replaceXmlText(xml: string, search: string, replacement: string): string {
    return xml.replace(new RegExp(this.escapeRegex(search), 'g'), replacement);
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

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}