import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IFileStorageService, UploadFileInput } from '../domain/storage.service.interface.js';

const MANAGED_KEY_PREFIX = 'tenants/';

@Injectable()
export class LocalFileStorageService implements IFileStorageService {
  private readonly basePath: string;

  constructor(private readonly config: ConfigService) {
    this.basePath = this.config.get<string>('storage.localPath', 'data/files');
  }

  async upload(input: UploadFileInput): Promise<{ key: string }> {
    const absolutePath = join(this.basePath, input.key);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.body);
    return { key: input.key };
  }

  async delete(key: string): Promise<void> {
    await rm(join(this.basePath, key), { force: true });
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
    return join(this.basePath, storedValue).replace(/\\/g, '/');
  }
}
