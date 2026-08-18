import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Credential Cloudinary belum lengkap — fitur upload/download dokumen nggak jalan sampai .env diisi',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.logger.log('Cloudinary configured');
  }

  /**
   * Path dipakai sebagai public_id. Cloudinary nggak suka titik di public_id
   * (dikira ekstensi), jadi ekstensi dibuang — tipe file udah dibawa
   * resource_type + format.
   */
  private toPublicId(path: string): string {
    return path.replace(/\.[^./]+$/, '');
  }

  private isRaw(path: string): boolean {
    return /\.(pdf|docx?|xlsx?)$/i.test(path);
  }

  /**
   * Upload buffer (dipakai untuk PDF/DOCX hasil generate dan file multipart).
   * Return public_id — itu yang disimpan ke kolom pdfPath / docxPath / ttd*.
   */
  async upload(path: string, buffer: Buffer, contentType: string): Promise<string> {
    const publicId = this.toPublicId(path);
    const resourceType = this.isRaw(path) ? 'raw' : 'image';
    const format = path.split('.').pop();

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          // authenticated = nggak bisa diakses tanpa signed URL,
          // meskipun orang tahu URL-nya
          type: 'authenticated',
          format,
          overwrite: true,
          invalidate: true,
        },
        (err, res) => {
          if (err) return reject(err);
          if (!res) return reject(new Error('Cloudinary tidak mengembalikan hasil upload'));
          resolve(res);
        },
      );
      stream.end(buffer);
    });

    this.logger.debug(`Uploaded ${result.public_id} (${result.resource_type})`);
    return path;
  }

  /**
   * Upload gambar tanda tangan dari canvas (data:image/png;base64,...).
   * Cloudinary nerima data URI langsung, nggak perlu strip prefix manual.
   */
  async uploadBase64(path: string, base64Data: string): Promise<string> {
    const publicId = this.toPublicId(path);

    const result = await cloudinary.uploader.upload(base64Data, {
      public_id: publicId,
      resource_type: 'image',
      type: 'authenticated',
      overwrite: true,
      invalidate: true,
    });

    this.logger.debug(`Uploaded signature ${result.public_id}`);
    return path;
  }

  /**
   * Ambil balik file sebagai Buffer. Dipakai untuk:
   * - convert tanda tangan ke base64 sebelum di-render ke PDF/DOCX
   * - streaming file ke user di endpoint download
   */
  async getBuffer(path: string): Promise<Buffer> {
    const url = this.getSignedUrl(path, 300);
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Gagal ambil file dari Cloudinary (${res.status}): ${path}`);
    }

    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Signed URL dengan expiry. Tanpa signature yang valid, Cloudinary nolak
   * request-nya — jadi link yang bocor pun nggak bisa dipakai selamanya.
   */
  getSignedUrl(path: string, expiry = 3600): string {
    const publicId = this.toPublicId(path);
    const resourceType = this.isRaw(path) ? 'raw' : 'image';
    const format = path.split('.').pop();

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      format,
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + expiry,
    });
  }

  /** Alias async, biar kompatibel dengan pemanggilan lama yang pakai await. */
  async getPresignedUrl(path: string, expiry = 3600): Promise<string> {
    return this.getSignedUrl(path, expiry);
  }

  async delete(path: string): Promise<void> {
    const publicId = this.toPublicId(path);
    const resourceType = this.isRaw(path) ? 'raw' : 'image';

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
    });
  }
}