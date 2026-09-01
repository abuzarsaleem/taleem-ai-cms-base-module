import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IFileStorageService, UploadFileInput } from '../domain/storage.service.interface.js';

const MANAGED_KEY_PREFIX = 'tenants/';

@Injectable()
export class B2S3StorageService implements IFileStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly signedUrls: boolean;
  private readonly signedUrlTtlSeconds: number;

  constructor(private readonly config: ConfigService) {
    const s3 = this.config.getOrThrow<{ endpoint: string; region: string; accessKey: string; secretKey: string; bucket: string; forcePathStyle: boolean; signedUrls: boolean; signedUrlTtlSeconds: number; publicUrl: string }>('storage.s3');

    this.client = new S3Client({
      endpoint: s3.endpoint,
      region: s3.region,
      credentials: {
        accessKeyId: s3.accessKey,
        secretAccessKey: s3.secretKey,
      },
      forcePathStyle: s3.forcePathStyle,
    });
    this.bucket = s3.bucket;
    this.publicUrl = s3.publicUrl.replace(/\/$/, '');
    this.signedUrls = s3.signedUrls;
    this.signedUrlTtlSeconds = s3.signedUrlTtlSeconds;
  }

  async upload(input: UploadFileInput): Promise<{ key: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return { key: input.key };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  isManagedKey(storedValue: string): boolean {
    return storedValue.startsWith(MANAGED_KEY_PREFIX);
  }

  extractKey(storedValue: string): string | null {
    return this.isManagedKey(storedValue) ? storedValue : null;
  }

  async resolveUrl(storedValue: string): Promise<string> {
    if (!this.isManagedKey(storedValue)) {
      return storedValue;
    }

    if (this.signedUrls) {
      return getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: storedValue }),
        { expiresIn: this.signedUrlTtlSeconds },
      );
    }

    return `${this.publicUrl}/${storedValue}`;
  }
}
